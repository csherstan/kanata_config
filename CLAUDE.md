# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-file web application ([kanata-visualizer.html](kanata-visualizer.html)) that provides a visual interface for creating and editing [Kanata](https://github.com/jtroo/kanata) keyboard configuration files. Kanata is a keyboard remapping tool, and this visualizer helps users:

- Load existing Kanata configuration files
- Visualize keyboard layouts with current key mappings
- Create and manage layers (different keyboard mapping modes)
- Define key actions (basic keys, layer switching, tap-hold, aliases)
- Generate and download valid Kanata configuration files

The configuration format is based on Kanata v1.10.0 ([config documentation](https://github.com/jtroo/kanata/blob/v1.10.0/docs/config.adoc)).

## Architecture

### Single-File Structure

All code is contained in [kanata-visualizer.html](kanata-visualizer.html):
- HTML structure with modals for editing keys, layers, and aliases
- CSS styling (embedded in `<style>` tags)
- JavaScript application logic (embedded in `<script>` tags)

### State Management

The application uses a single global `state` object (line ~530):

```javascript
const state = {
    config: {
        defsrc: [],      // Array of key codes defining the keyboard layout
        layers: {},      // Object mapping layer names to arrays of actions
        aliases: {}      // Object mapping alias names to action definitions
    },
    ui: {
        activeLayer: 'base',          // Currently displayed layer
        keyboardLayout: 'ansi',       // 'ansi' or 'iso' keyboard layout
        editingKeyIndex: null,        // Index of key being edited
        editingAlias: null            // Name of alias being edited
    }
};
```

### Key Components

1. **Keyboard Layouts** (`KEYBOARD_LAYOUTS`, line ~545): Defines ANSI and ISO keyboard layouts with key positions, sizes, and codes

2. **Config Parser** (`parseConfig()`, line ~789): Tokenizes and parses Kanata configuration files into the state object
   - `tokenize()`: Converts text into tokens (parens, strings, whitespace)
   - `parseExpression()`: Recursively parses S-expression-like syntax

3. **Config Generator** (`generateConfig()`, line ~827): Converts state object back into valid Kanata configuration format

4. **Rendering Functions**:
   - `renderKeyboard()` (line ~857): Draws the keyboard with current layer mappings
   - `renderLayers()` (line ~932): Updates layer tabs in UI
   - `formatAction()` (line ~918): Converts action objects to display strings

5. **Modal System**: Multiple modals for editing different aspects:
   - Key mapping modal (`#keyModal`)
   - Layer creation modal (`#layerModal`)
   - Alias management modal (`#aliasesModal`)
   - Alias editing modal (`#editAliasModal`)

### Action Types

The visualizer supports these Kanata action types:
- **basic**: Simple key remapping (e.g., `a` → `b`)
- **layer-switch**: Persistent layer change (`layer-switch <layer>`)
- **layer-while-held**: Temporary layer while key held (`layer-while-held <layer>`)
- **tap-hold**: Different action for tap vs hold (`tap-hold <tap-timeout> <hold-timeout> <tap-action> <hold-action>`)
- **transparent**: Pass-through to lower layer (`_`)
- **alias**: Reference to a defined alias (`@<name>`)

## Testing

### Running Tests

The project uses Playwright for end-to-end testing:

```bash
# Run all tests
npm test

# Run tests with browser UI visible
npm run test:headed

# Open interactive test UI
npm run test:ui

# View last test report
npm run test:report
```

### Test Structure

Tests are in [tests/key-mappings.test.js](tests/key-mappings.test.js) and verify:
- Loading sample configurations
- Creating and editing key mappings for all action types
- Layer management (creation, switching, deletion)
- Alias creation and usage
- Config generation and download

Each test:
1. Loads the HTML file via `file://` protocol
2. Loads the sample configuration
3. Interacts with the UI via Playwright
4. Verifies expected behavior

### Test Configuration

See [playwright.config.js](playwright.config.js):
- Tests run in Chromium by default
- Timeout: 30 seconds per test
- Generates HTML report on completion
- Takes screenshots on failure

## Development Workflow

1. **Edit the HTML file**: All changes go in [kanata-visualizer.html](kanata-visualizer.html)

2. **Manual testing**: Open the HTML file directly in a browser (`file:///path/to/kanata-visualizer.html`)

3. **Automated testing**: Run `npm test` after changes

4. **Understanding Kanata syntax**: Refer to the [official Kanata config documentation](https://github.com/jtroo/kanata/blob/v1.10.0/docs/config.adoc)

## Key Implementation Details

### S-Expression Parsing

Kanata configs use S-expression syntax (similar to Lisp). The parser handles:
- Nested expressions with parentheses
- Quoted strings
- Symbols and keywords
- Commands: `defsrc`, `deflayer`, `defalias`

### Keyboard Coordinate System

Keys are positioned using a row/column grid with fractional positions to support different key widths:
- `row`: Vertical position (1-6)
- `col`: Horizontal position with decimal precision (e.g., 2.75 for offset keys)
- `width`: Key width in standard key units (1.0 = normal key, 2.0 = double-width)

### Layer Inheritance

The visualizer implements transparent keys (`_`) which fall through to lower layers. This is a core Kanata concept where undefined keys in a layer use the mapping from layers below.
