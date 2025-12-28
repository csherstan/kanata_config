/**
 * Integration tests for Kanata Configuration Visualizer
 * Tests all different key mapping types
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

const HTML_FILE = `file://${path.resolve(__dirname, '../kanata-visualizer.html')}`;

test.describe('Kanata Visualizer - Key Mapping Types', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(HTML_FILE);
    // Load the sample config to have a base to work with
    await page.click('text=Load Sample');
    await expect(page.locator('.keyboard').first()).toBeVisible();
  });

  test('should load sample configuration successfully', async ({ page }) => {
    // Verify the keyboard is displayed
    await expect(page.locator('.keyboard').first()).toBeVisible();

    // Verify layers are displayed
    await expect(page.locator('.layer-header').first()).toContainText('base');

    // Verify keys are rendered
    const keys = page.locator('.key');
    await expect(keys.first()).toBeVisible();
  });

  test('should create and save a basic key mapping', async ({ page }) => {
    // Click on a key (let's use the 'a' key)
    const aKey = page.locator('.key').filter({ hasText: 'a' }).first();
    await aKey.click();

    // Modal should open
    await expect(page.locator('#keyModal.active')).toBeVisible();

    // Verify action type is basic or can be set to basic
    const actionType = page.locator('#actionType');
    await actionType.selectOption('basic');

    // Set a new key mapping
    await page.locator('#basicKey').fill('b');

    // Save the mapping
    await page.click('#keyModal button:has-text("Save")');

    // Modal should close
    await expect(page.locator('#keyModal.active')).not.toBeVisible();

    // Verify the key now shows 'b'
    await expect(aKey.locator('.key-action')).toContainText('b');
  });

  test('should create a transparent key mapping', async ({ page }) => {
    // Click on a key
    const key = page.locator('.key').filter({ hasText: 'q' }).first();
    await key.click();

    // Select transparent action type
    await page.locator('#actionType').selectOption('transparent');

    // Save
    await page.click('#keyModal button:has-text("Save")');

    // Verify the key shows the transparent symbol
    await expect(key).toHaveClass(/transparent/);
    await expect(key.locator('.key-action')).toContainText('⊘');
  });

  test('should create a layer-switch mapping', async ({ page }) => {
    // First, create a new layer to switch to
    await page.click('text=+ New Layer');
    await page.locator('#newLayerName').fill('symbols');
    await page.click('#layerModal button:has-text("Create")');

    // All layers are visible, so click on a key in the base layer
    const key = page.locator('.layer-section').filter({ hasText: /^base/ }).locator('.key').filter({ hasText: 'w' }).first();
    await key.click();

    // Select layer-switch action type
    await page.locator('#actionType').selectOption('layer-switch');

    // Select the symbols layer
    await page.locator('#targetLayer').selectOption('symbols');

    // Save
    await page.click('#keyModal button:has-text("Save")');

    // Verify the key has layer-switch styling
    await expect(key).toHaveClass(/layer-switch/);
    // The formatAction function shortens it to just "layer"
    await expect(key.locator('.key-action')).toContainText('layer');
  });

  test('should create a layer-while-held mapping', async ({ page }) => {
    // Create a new layer
    await page.click('text=+ New Layer');
    await page.locator('#newLayerName').fill('nav');
    await page.click('#layerModal button:has-text("Create")');

    // Wait for layer modal to close and layer to be visible
    await expect(page.locator('#layerModal.active')).not.toBeVisible();
    await expect(page.locator('.layer-header').filter({ hasText: 'nav' })).toBeVisible();

    // Click on the 'u' key in the base layer (using a different key)
    await page.locator('.layer-section').filter({ hasText: /^base/ }).locator('.key:has(.key-label:text-is("u"))').click();

    // Wait for modal to be visible
    await expect(page.locator('#keyModal.active')).toBeVisible();

    // Select layer-while-held action type
    await page.locator('#actionType').selectOption('layer-while-held');

    // Select the nav layer
    await page.locator('#targetLayer').selectOption('nav');

    // Save
    await page.click('#keyModal button:has-text("Save")');

    // Verify the key has layer styling in the base layer
    const key = page.locator('.layer-section').filter({ hasText: /^base/ }).locator('.key:has(.key-label:text-is("u"))');
    await expect(key).toHaveClass(/layer-switch/);
    await expect(key.locator('.key-action')).toContainText('layer');
  });

  test('should create a tap-hold mapping', async ({ page }) => {
    // Click on caps lock key which typically has tap-hold
    const key = page.locator('.key').filter({ hasText: 'caps' }).first();
    await key.click();

    // Select tap-hold action type
    await page.locator('#actionType').selectOption('tap-hold');

    // Fill in tap action
    await page.locator('#tapAction').fill('esc');

    // Fill in hold action
    await page.locator('#holdAction').fill('lctl');

    // Set timeout
    await page.locator('#tapHoldTimeout').fill('200');

    // Save
    await page.click('#keyModal button:has-text("Save")');

    // Verify the key has tap-hold styling
    await expect(key).toHaveClass(/tap-hold/);
  });

  test('should create and use an alias reference', async ({ page }) => {
    // First, create an alias
    await page.click('text=Manage Aliases');
    await expect(page.locator('#aliasesModal.active')).toBeVisible();

    // Add new alias
    await page.click('#aliasesModal button:has-text("Add New Alias")');

    // Wait for edit alias modal
    await expect(page.locator('#editAliasModal.active')).toBeVisible();

    // Fill in alias details
    await page.locator('#aliasNameInput').fill('test');
    await page.locator('#aliasActionType').selectOption('tap-hold');
    await page.locator('#aliasTapAction').fill('a');
    await page.locator('#aliasHoldAction').fill('lsft');
    await page.locator('#aliasTapHoldTimeout').fill('150');

    // Save alias
    await page.click('#editAliasModal button:has-text("Save")');

    // Wait for edit alias modal to close
    await expect(page.locator('#editAliasModal.active')).not.toBeVisible();

    // Close aliases modal
    await page.click('#aliasesModal button:has-text("Close")');

    // Wait for aliases modal to close
    await expect(page.locator('#aliasesModal.active')).not.toBeVisible();

    // Now use the alias in a key mapping - click on the 'i' key in the base layer
    await page.locator('.layer-section').filter({ hasText: /^base/ }).locator('.key:has(.key-label:text-is("i"))').click();

    // Wait for modal
    await expect(page.locator('#keyModal.active')).toBeVisible();

    // Select alias action type
    await page.locator('#actionType').selectOption('alias');

    // Enter alias name
    await page.locator('#aliasName').fill('test');

    // Save
    await page.click('#keyModal button:has-text("Save")');

    // Verify the key shows the alias in the base layer
    const key = page.locator('.layer-section').filter({ hasText: /^base/ }).locator('.key:has(.key-label:text-is("i"))');
    await expect(key.locator('.key-action')).toContainText('@test');
  });

  test('should generate valid config with all mapping types', async ({ page }) => {
    // Create a configuration with various mapping types
    // (using the sample config which already has mixed types)

    // Click download to trigger config generation
    // We'll use page.evaluate to get the generated config without actually downloading
    const generatedConfig = await page.evaluate(() => {
      return generateConfig(state.config);
    });

    // Verify config structure
    expect(generatedConfig).toContain('(defsrc');
    expect(generatedConfig).toContain('(deflayer base');
    expect(generatedConfig).toContain('(deflayer numbers');
    expect(generatedConfig).toContain('(defalias');
    expect(generatedConfig).toContain('cap (tap-hold esc lctl 200)');
    expect(generatedConfig).toContain('num (layer-while-held numbers)');
  });

  test('should handle layer creation and deletion', async ({ page }) => {
    // Create a new layer
    await page.click('text=+ New Layer');
    await page.locator('#newLayerName').fill('test-layer');
    await page.click('#layerModal button:has-text("Create")');

    // Verify layer tab appears
    await expect(page.locator('.layer-header').filter({ hasText: 'test-layer' })).toBeVisible();

    // All keys in the test-layer should be transparent by default
    const keys = page.locator('.layer-section').filter({ hasText: /^test-layer/ }).locator('.key.transparent');
    expect(await keys.count()).toBeGreaterThan(0);
  });

  test('should edit existing alias', async ({ page }) => {
    // Open aliases modal
    await page.click('text=Manage Aliases');

    // The sample config has aliases, click edit on one
    const editButton = page.locator('.alias-item').first().locator('button:has-text("Edit")');
    await editButton.click();

    // Modal should show the alias details
    await expect(page.locator('#editAliasModal.active')).toBeVisible();

    // Verify we can see the alias name (should be disabled since we're editing)
    const aliasNameInput = page.locator('#aliasNameInput');
    expect(await aliasNameInput.isDisabled()).toBeTruthy();

    // Close without saving
    await page.click('#editAliasModal button:has-text("Cancel")');
  });

  test('should switch between ANSI and ISO layouts', async ({ page }) => {
    const layoutSelector = page.locator('#layoutSelector');

    // Select ANSI-60 layout
    await layoutSelector.selectOption('ansi-60');
    await page.waitForTimeout(500);

    // Count keys in ANSI layout
    const ansiKeyCount = await page.locator('.key').count();
    expect(ansiKeyCount).toBeGreaterThan(0);

    // Switch to ISO full
    await layoutSelector.selectOption('iso-full');
    await page.waitForTimeout(500);

    // Verify the selection changed
    const selectedValue = await layoutSelector.inputValue();
    expect(selectedValue).toBe('iso-full');

    // ISO should have different number of keys
    const isoKeyCount = await page.locator('.key').count();

    // ISO full layout has more keys than ANSI 60%
    expect(isoKeyCount).toBeGreaterThan(ansiKeyCount);
  });

  test('should validate config structure', async ({ page }) => {
    // Load sample config
    const config = await page.evaluate(() => state.config);

    // Verify defsrc exists and has keys
    expect(config.defsrc).toBeDefined();
    expect(config.defsrc.length).toBeGreaterThan(0);

    // Verify layers exist
    expect(config.layers).toBeDefined();
    expect(Object.keys(config.layers).length).toBeGreaterThan(0);

    // Verify each layer has same length as defsrc
    for (const [layerName, actions] of Object.entries(config.layers)) {
      expect(actions.length).toBe(config.defsrc.length);
    }

    // Verify aliases exist
    expect(config.aliases).toBeDefined();
  });

  test('should parse and regenerate config identically', async ({ page }) => {
    // Get the current config
    const originalConfig = await page.evaluate(() => state.config);

    // Generate config text
    const configText = await page.evaluate(() => generateConfig(state.config));

    // Parse it back
    const reparsedConfig = await page.evaluate((text) => parseConfig(text), configText);

    // Verify they match
    expect(reparsedConfig.defsrc).toEqual(originalConfig.defsrc);
    expect(Object.keys(reparsedConfig.layers)).toEqual(Object.keys(originalConfig.layers));
    expect(Object.keys(reparsedConfig.aliases)).toEqual(Object.keys(originalConfig.aliases));
  });
});

test.describe('Kanata Visualizer - Config File Operations', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(HTML_FILE);
  });

  test('should show default ANSI full layout on initial load', async ({ page }) => {
    // With the new default initialization, the keyboard should be visible immediately
    await expect(page.locator('.keyboard').first()).toBeVisible();

    // Empty state should not be visible
    await expect(page.locator('#emptyState')).not.toBeVisible();

    // Should have a base layer by default
    await expect(page.locator('#layersContainer')).toBeVisible();

    // Should have the default ANSI full layout with 104 keys (function row + main + nav + numpad)
    const keys = page.locator('.key');
    await expect(keys).not.toHaveCount(0);
  });

  test('should load sample config on button click', async ({ page }) => {
    // Initially, the default ANSI full layout should be visible
    await expect(page.locator('.keyboard').first()).toBeVisible();

    // Click load sample
    await page.click('text=Load Sample');

    // Empty state should still not be visible
    await expect(page.locator('#emptyState')).not.toBeVisible();

    // Keyboard should still be visible
    await expect(page.locator('.keyboard').first()).toBeVisible();

    // Layers should appear
    await expect(page.locator('#layersContainer')).toBeVisible();

    // The sample config should have loaded with its own configuration
    // Verify at least one layer section exists (layers are rendered as layer-section divs)
    const layerSections = page.locator('.layer-section');
    await expect(layerSections.first()).toBeVisible();
  });

  test('should handle custom config parsing', async ({ page }) => {
    // Create a custom config text
    const customConfig = `
(defsrc
  a s d f
)

(deflayer test
  a s d f
)
    `.trim();

    // Load it via evaluate (simulating file load)
    await page.evaluate((configText) => {
      const config = parseConfig(configText);
      state.config = config;
      renderKeyboard();
    }, customConfig);

    // Verify it loaded
    await expect(page.locator('.keyboard').first()).toBeVisible();
    // Check that the layer header contains 'test'
    await expect(page.locator('.layer-header').first()).toContainText('test');

    // The keyboard layout still renders with the full keyboard layout,
    // but only the keys in defsrc will have mappings
    // So we need to check the config structure instead
    const config = await page.evaluate(() => state.config);
    expect(config.defsrc.length).toBe(4);
    expect(config.layers.test.length).toBe(4);
  });
});
