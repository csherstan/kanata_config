const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Layout Selection Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the HTML file
    const htmlPath = path.join(__dirname, '..', 'kanata-visualizer.html');
    await page.goto(`file://${htmlPath}`);

    // Wait for layouts to load
    await page.waitForFunction(() => {
      return window.LAYOUTS_LOADING &&
             window.LAYOUTS_LOADING.loaded >= window.LAYOUTS_LOADING.total;
    });

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should show layout selection modal when loading config without layout data', async ({ page }) => {
    // Prepare to handle the file chooser
    const fileChooserPromise = page.waitForEvent('filechooser');

    // Click the load button
    await page.click('text=Load Config');

    // Select the test config file
    const fileChooser = await fileChooserPromise;
    const testConfigPath = path.join(__dirname, '..', 'test-config-no-layout.kbd');
    await fileChooser.setFiles(testConfigPath);

    // Wait for the layout selection modal to appear
    await page.waitForSelector('#layoutSelectionModal.active', { timeout: 5000 });

    // Verify modal is visible
    const modal = page.locator('#layoutSelectionModal');
    await expect(modal).toHaveClass(/active/);

    // Verify modal has correct title
    await expect(modal.locator('.modal-header')).toContainText('Select Keyboard Layout');

    // Verify info box is present
    await expect(modal.locator('.info-box h3')).toContainText('No Layout Data Found');

    // Verify dropdown is populated
    const dropdown = page.locator('#layoutSelectionDropdown');
    const options = await dropdown.locator('option').count();
    expect(options).toBeGreaterThan(0);

    // Verify suggested layout is selected (should be ansi-60 for 57 keys)
    const selectedValue = await dropdown.inputValue();
    expect(selectedValue).toBe('ansi-60');
  });

  test('should apply selected layout and render keyboard', async ({ page }) => {
    // Load config without layout data
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Load Config');
    const fileChooser = await fileChooserPromise;
    const testConfigPath = path.join(__dirname, '..', 'test-config-no-layout.kbd');
    await fileChooser.setFiles(testConfigPath);

    // Wait for modal
    await page.waitForSelector('#layoutSelectionModal.active');

    // Select a different layout (ansi-tkl)
    await page.locator('#layoutSelectionDropdown').selectOption('ansi-tkl');

    // Click apply
    await page.click('#layoutSelectionModal button:has-text("Apply Layout")');

    // Wait for modal to close (check that active class is removed)
    await page.waitForFunction(() => {
      const modal = document.getElementById('layoutSelectionModal');
      return !modal.classList.contains('active');
    });

    // Verify keyboard is rendered
    const keyboard = page.locator('.keyboard').first();
    await expect(keyboard).toBeVisible();

    // Verify keys are present
    const keys = page.locator('.key');
    const keyCount = await keys.count();
    expect(keyCount).toBeGreaterThan(0);

    // Verify we can see the base layer
    await expect(page.locator('.layer-title').first()).toContainText('base');
  });

  test('should cancel layout selection', async ({ page }) => {
    // Get the initial state (should have the default keyboard from initialization)
    const initialLayerCount = await page.locator('.layer-section').count();

    // Load config without layout data
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Load Config');
    const fileChooser = await fileChooserPromise;
    const testConfigPath = path.join(__dirname, '..', 'test-config-no-layout.kbd');
    await fileChooser.setFiles(testConfigPath);

    // Wait for modal
    await page.waitForSelector('#layoutSelectionModal.active');

    // Click cancel
    await page.click('#layoutSelectionModal button:has-text("Cancel")');

    // Wait for modal to close (check that active class is removed)
    await page.waitForFunction(() => {
      const modal = document.getElementById('layoutSelectionModal');
      return !modal.classList.contains('active');
    });

    // Verify the state hasn't changed - should still show the initial layout
    // (The page initializes with a default layout, so canceling doesn't clear it)
    const finalLayerCount = await page.locator('.layer-section').count();
    expect(finalLayerCount).toBe(initialLayerCount);

    // Modal should be closed
    await expect(page.locator('#layoutSelectionModal')).not.toHaveClass(/active/);
  });

  test('should intelligently suggest layout based on key count', async ({ page }) => {
    // This test verifies that the suggested layout matches the key count
    // 57 keys -> ansi-60
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Load Config');
    const fileChooser = await fileChooserPromise;
    const testConfigPath = path.join(__dirname, '..', 'test-config-no-layout.kbd');
    await fileChooser.setFiles(testConfigPath);

    // Wait for modal
    await page.waitForSelector('#layoutSelectionModal.active');

    // Check suggested layout
    const dropdown = page.locator('#layoutSelectionDropdown');
    const selectedValue = await dropdown.inputValue();

    // 57 keys should suggest ansi-60 (<=62 keys)
    expect(selectedValue).toBe('ansi-60');
  });

  test('should not show layout selection modal when loading config with layout data', async ({ page }) => {
    // First, create a sample config (which has layout data)
    await page.click('text=Load Sample');

    // Download the config
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Download Config');
    const download = await downloadPromise;

    // Save the file
    const downloadPath = path.join(__dirname, '..', 'temp-config-with-layout.kbd');
    await download.saveAs(downloadPath);

    // Reload the page
    const htmlPath = path.join(__dirname, '..', 'kanata-visualizer.html');
    await page.goto(`file://${htmlPath}`);
    await page.waitForFunction(() => {
      return window.LAYOUTS_LOADING &&
             window.LAYOUTS_LOADING.loaded >= window.LAYOUTS_LOADING.total;
    });

    // Load the config with layout data
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Load Config');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(downloadPath);

    // Wait a bit to ensure modal doesn't appear
    await page.waitForTimeout(1000);

    // Verify modal is NOT visible
    const modal = page.locator('#layoutSelectionModal');
    await expect(modal).not.toHaveClass(/active/);

    // Verify keyboard IS rendered
    const keyboard = page.locator('.keyboard').first();
    await expect(keyboard).toBeVisible();

    // Cleanup
    const fs = require('fs');
    if (fs.existsSync(downloadPath)) {
      fs.unlinkSync(downloadPath);
    }
  });
});
