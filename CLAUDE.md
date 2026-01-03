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

### Overall System Design

The application follows a modular architecture with these key components:

1. **Main Application** ([kanata-visualizer.html](kanata-visualizer.html)): Single-file web application containing:
   - HTML structure with modals for editing keys, layers, and aliases
   - CSS styling (embedded in `<style>` tags)
   - JavaScript application logic (embedded in `<script>` tags)

2. **Modular Keyboard Layouts** ([layouts/](layouts/)): External JavaScript files defining different keyboard layouts
   - Each layout is a self-contained module that registers itself to `window.KEYBOARD_LAYOUTS`
   - Layout manifest ([layouts/index.js](layouts/index.js)) lists all available layout files
   - Layouts are dynamically loaded at runtime via script tags

### Data Flow

```
User loads HTML file
    ↓
HTML loads layout manifest (layouts/index.js)
    ↓
Manifest tells browser which layout files to load
    ↓
Each layout file registers itself to window.KEYBOARD_LAYOUTS
    ↓
User selects a layout from dropdown
    ↓
Layout data populates state.config.defsrc and keyboard grid
    ↓
User loads/edits Kanata config
    ↓
Config parser updates state object
    ↓
Render functions draw keyboard and UI
    ↓
User exports config
    ↓
Config generator creates Kanata file from state
```

### Layout System

Keyboard layouts are defined in modular JavaScript files in the [layouts/](layouts/) directory:

- **Layout Manifest** ([layouts/index.js](layouts/index.js)): Simple array of layout filenames
- **Layout Modules**: Each layout file is an IIFE that adds itself to `window.KEYBOARD_LAYOUTS`
- **Layout Structure**: Each layout contains:
  - `name`: Human-readable display name
  - `defsrc`: Ordered array of Kanata key codes
  - `grid`: 2D array showing keyboard row/column structure
  - `layoutData`: Object mapping key codes to positions/sizes (x, y, w, h)

The main HTML dynamically loads layout scripts and populates a dropdown menu. When users select a layout, the application:
1. Updates `state.config.defsrc` with the layout's key codes
2. Renders the keyboard grid using the layout's position data
3. Automatically extends layer definitions to match layout size

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

1. **Keyboard Layouts** (`KEYBOARD_LAYOUTS`, line ~545): Defines keyboard layouts with key positions, sizes, and codes
   - Loaded dynamically from [layouts/](layouts/) directory
   - Each layout is a self-registering module

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

### State-to-UI Rendering Cycle

The application follows a unidirectional data flow:

1. **User Action** → Triggers event handler (click, input, etc.)
2. **State Update** → Handler modifies the `state` object
3. **Re-render** → Calls `renderKeyboard()` and/or `renderLayers()`
4. **DOM Update** → Rendering functions update the visible UI

Example flow for editing a key:
```
User clicks key → openKeyModal() → Shows modal with current action
User changes action → saveKeyMapping() → Updates state.config.layers[activeLayer][keyIndex]
                                       → Calls renderKeyboard()
                                       → DOM shows updated key label
```

This pattern ensures the UI always reflects the current state, and all state changes flow through explicit update functions.

### Action Types

The visualizer supports these Kanata action types:
- **basic**: Simple key remapping (e.g., `a` → `b`)
- **layer-switch**: Persistent layer change (`layer-switch <layer>`)
- **layer-while-held**: Temporary layer while key held (`layer-while-held <layer>`)
- **tap-hold**: Different action for tap vs hold (`tap-hold <tap-timeout> <hold-timeout> <tap-action> <hold-action>`)
- **transparent**: Pass-through to lower layer (`_`)
- **alias**: Reference to a defined alias (`@<name>`)

## Testing

### Automated Testing with Playwright

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

### Interactive Testing with Playwright MCP

**IMPORTANT**: When manually testing the web application or debugging issues, use the Playwright MCP tools instead of manually opening the browser. This provides better visibility into the application state and interactions.

#### Using Playwright MCP

1. **Navigate to the page**: Use the appropriate URL for the HTML file
   ```
   mcp__playwright__browser_navigate with url: file:///absolute/path/to/kanata-visualizer.html
   ```

2. **Take snapshots**: Get accessible representation of the page state
   ```
   mcp__playwright__browser_snapshot
   ```

3. **Interact with elements**: Click buttons, fill forms, etc.
   ```
   mcp__playwright__browser_click
   mcp__playwright__browser_fill_form
   mcp__playwright__browser_type
   ```

4. **Verify behavior**: Check console messages, network requests, screenshots
   ```
   mcp__playwright__browser_console_messages
   mcp__playwright__browser_network_requests
   mcp__playwright__browser_take_screenshot
   ```

5. **Run custom code**: Execute JavaScript directly in the page context
   ```
   mcp__playwright__browser_evaluate
   ```

#### When to Use Playwright MCP

Use Playwright MCP tools when:
- Testing a new feature interactively
- Debugging UI issues or unexpected behavior
- Verifying that changes work correctly before committing
- Investigating bug reports that require reproducing specific interactions
- Checking how the application handles edge cases

This approach is faster than writing full test scripts and provides immediate feedback during development.

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

1. **Edit files**:
   - Main application: [kanata-visualizer.html](kanata-visualizer.html)
   - Keyboard layouts: [layouts/](layouts/) directory
   - Add new layouts to [layouts/index.js](layouts/index.js)

2. **Interactive testing**: Use Playwright MCP tools (preferred for development)
   - Navigate to the HTML file
   - Take snapshots to inspect page state
   - Interact with elements and verify behavior
   - See "Interactive Testing with Playwright MCP" section above

3. **Manual testing**: Open the HTML file directly in a browser (`file:///path/to/kanata-visualizer.html`)
   - Useful for quick visual checks
   - Use browser DevTools for debugging

4. **Automated testing**: Run `npm test` after changes
   - Run full test suite before committing
   - Ensure all existing functionality still works

5. **Understanding Kanata syntax**: Refer to the [official Kanata config documentation](https://github.com/jtroo/kanata/blob/v1.10.0/docs/config.adoc)

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
