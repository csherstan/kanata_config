# Kanata Configuration Visualizer - Test Suite

This directory contains automated integration tests for the Kanata Configuration Visualizer using Playwright.

## Overview

The test suite validates all key mapping types and configuration operations in the visualizer through real browser automation.

## Test Coverage

### Key Mapping Types

The following key mapping types are fully tested:

1. **Basic Key Mappings** - Simple key-to-key remapping
2. **Transparent Mappings** - Keys that pass through to lower layers (`_` or `XX`)
3. **Layer-Switch Mappings** - Persistent layer switching `(layer-switch <layer>)`
4. **Layer-While-Held Mappings** - Temporary layer activation `(layer-while-held <layer>)`
5. **Tap-Hold Mappings** - Different actions for tap vs hold `(tap-hold <tap> <hold> <timeout>)`
6. **Alias References** - Using defined aliases in key mappings `@<alias>`

### Configuration Operations

- Loading sample configurations
- Creating and deleting layers
- Managing aliases (create, edit, delete)
- Switching between ANSI and ISO keyboard layouts
- Parsing and generating configuration files
- Configuration validation

## Running Tests

### Run all tests (headless)
```bash
npm test
```

### Run tests with visible browser
```bash
npm run test:headed
```

### Run tests in interactive UI mode
```bash
npm run test:ui
```

### View test report
```bash
npm run test:report
```

## Test Structure

All tests are located in [`key-mappings.test.js`](./key-mappings.test.js) and organized into two main describe blocks:

1. **Kanata Visualizer - Key Mapping Types** (14 tests)
   - Tests for each mapping type
   - Config generation and validation
   - Layer management
   - Layout switching

2. **Kanata Visualizer - Config File Operations** (3 tests)
   - Empty state handling
   - Sample config loading
   - Custom config parsing

## Test Details

Each test follows this general pattern:
1. Load the sample configuration
2. Interact with the UI (click keys, open modals, fill forms)
3. Verify the expected state/behavior

### Example: Testing Tap-Hold Mapping

```javascript
test('should create a tap-hold mapping', async ({ page }) => {
  const key = page.locator('.key').filter({ hasText: 'caps' }).first();
  await key.click();

  await page.locator('#actionType').selectOption('tap-hold');
  await page.locator('#tapAction').fill('esc');
  await page.locator('#holdAction').fill('lctl');
  await page.locator('#tapHoldTimeout').fill('200');

  await page.click('#keyModal button:has-text("Save")');

  await expect(key).toHaveClass(/tap-hold/);
});
```

## Configuration

Test configuration is defined in [`../playwright.config.js`](../playwright.config.js):

- Tests run on Chromium by default
- Screenshots captured on failure
- Traces captured on first retry
- HTML and list reporters enabled

## Requirements

- Node.js
- Playwright Test (`@playwright/test`)
- Chromium browser (installed via `npx playwright install chromium`)

## CI/CD Integration

The tests are designed to run in CI environments:
- Fail build if `test.only` is found
- Retry failed tests up to 2 times
- Run tests sequentially in CI for stability

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.js`
- Check if the HTML file path is correct
- Ensure all modals properly open/close

### Element not found errors
- Check screenshots in `test-results/` directory
- Verify element selectors match the HTML structure
- Use `test:headed` to visually debug

### Flaky tests
- Tests include proper waits for modals and state changes
- If issues persist, check the error context files in test results

## Future Enhancements

Potential areas for test expansion:
- File upload/download testing
- Keyboard shortcut testing
- Accessibility testing
- Cross-browser testing (Firefox, WebKit)
- Performance testing
- Visual regression testing
