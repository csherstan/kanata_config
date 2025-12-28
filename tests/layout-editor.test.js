const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Layout Editor', () => {
    test.beforeEach(async ({ page }) => {
        const htmlPath = path.resolve(__dirname, '..', 'kanata-visualizer.html');
        await page.goto(`file://${htmlPath}`);

        // Load sample config
        await page.click('text=Load Sample');
        await page.waitForTimeout(500);
    });

    test('should not display position info on keys in edit mode', async ({ page }) => {
        // Enable layout edit mode
        await page.click('#layoutEditBtn');
        await page.waitForTimeout(500);

        // Check that position info is not displayed
        const positionInfo = await page.locator('.key-position-info').count();
        expect(positionInfo).toBe(0);
    });

    test('should reorder keys via drag and drop', async ({ page }) => {
        // Enable layout edit mode
        await page.click('#layoutEditBtn');
        await page.waitForTimeout(500);

        // Get initial key order from the entire defsrc
        const initialOrder = await page.evaluate(() => {
            return state.config.defsrc.slice();
        });

        console.log('Initial order:', initialOrder);
        console.log('f index:', initialOrder.indexOf('f'), 'd index:', initialOrder.indexOf('d'));

        // Use keys from the first row that we know exist: drag '3' to '5' position
        const sourceKey = page.locator('.key').filter({ has: page.locator('.key-label:text-is("3")') }).first();
        const targetKey = page.locator('.key').filter({ has: page.locator('.key-label:text-is("5")') }).first();

        // Verify keys exist
        await expect(sourceKey).toBeVisible();
        await expect(targetKey).toBeVisible();

        // Manual drag simulation using CDP to trigger actual HTML5 drag events
        await page.evaluate(async ({ sourceLabel, targetLabel }) => {
            // Find keys by their label text
            const allKeys = Array.from(document.querySelectorAll('.key'));
            const source = allKeys.find(key => {
                const label = key.querySelector('.key-label');
                return label && label.textContent.trim() === sourceLabel;
            });
            const target = allKeys.find(key => {
                const label = key.querySelector('.key-label');
                return label && label.textContent.trim() === targetLabel;
            });

            if (!source || !target) {
                throw new Error(`Could not find source (${sourceLabel}) or target (${targetLabel}) key`);
            }

            // Create and dispatch dragstart event
            const dragStartEvent = new DragEvent('dragstart', {
                bubbles: true,
                cancelable: true,
                dataTransfer: new DataTransfer()
            });
            source.dispatchEvent(dragStartEvent);

            // Simulate dragenter on target
            const dragEnterEvent = new DragEvent('dragenter', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dragStartEvent.dataTransfer
            });
            target.dispatchEvent(dragEnterEvent);

            // Simulate dragover on target
            const dragOverEvent = new DragEvent('dragover', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dragStartEvent.dataTransfer
            });
            target.dispatchEvent(dragOverEvent);

            // Simulate drop on target
            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dragStartEvent.dataTransfer
            });
            target.dispatchEvent(dropEvent);

            // Simulate dragend on source
            const dragEndEvent = new DragEvent('dragend', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dragStartEvent.dataTransfer
            });
            source.dispatchEvent(dragEndEvent);
        }, {
            sourceLabel: '3',
            targetLabel: '5'
        });

        await page.waitForTimeout(500);

        // Get new key order
        const newOrder = await page.evaluate(() => {
            return state.config.defsrc.slice();
        });

        console.log('New order:', newOrder);

        // Find indices in initial order
        const initial3Index = initialOrder.indexOf('3');
        const initial4Index = initialOrder.indexOf('4');
        const initial5Index = initialOrder.indexOf('5');

        console.log('Initial 3 at:', initial3Index, 'Initial 5 at:', initial5Index);
        console.log('New order at initial 4 position:', newOrder[initial4Index]);

        // After dragging 3 to 5, 3 should be inserted before 5 (at 4's position)
        // Expected result: grv, 1, 2, 4, 3, 5, ...
        expect(newOrder[initial4Index]).toBe('3');

        // Verify that the order changed
        expect(newOrder).not.toEqual(initialOrder);
    });

    test('should maintain key order in all layers when dragging', async ({ page }) => {
        // Enable layout edit mode
        await page.click('#layoutEditBtn');
        await page.waitForTimeout(500);

        // Get initial actions for '6' key in all layers
        const initialActions = await page.evaluate(() => {
            const keyIndex = state.config.defsrc.indexOf('6');
            const result = {};
            for (const layerName in state.config.layers) {
                result[layerName] = state.config.layers[layerName][keyIndex];
            }
            return { keyIndex, actions: result };
        });

        console.log('Initial 6 index and actions:', initialActions);

        // Drag '6' to '9' position
        const sourceKey = page.locator('.key').filter({ has: page.locator('.key-label:text-is("6")') }).first();
        const targetKey = page.locator('.key').filter({ has: page.locator('.key-label:text-is("9")') }).first();

        await expect(sourceKey).toBeVisible();
        await expect(targetKey).toBeVisible();

        // Manual drag simulation
        await page.evaluate(async ({ sourceLabel, targetLabel }) => {
            const allKeys = Array.from(document.querySelectorAll('.key'));
            const source = allKeys.find(key => {
                const label = key.querySelector('.key-label');
                return label && label.textContent.trim() === sourceLabel;
            });
            const target = allKeys.find(key => {
                const label = key.querySelector('.key-label');
                return label && label.textContent.trim() === targetLabel;
            });

            const dragStartEvent = new DragEvent('dragstart', {
                bubbles: true,
                cancelable: true,
                dataTransfer: new DataTransfer()
            });
            source.dispatchEvent(dragStartEvent);

            const dragEnterEvent = new DragEvent('dragenter', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dragStartEvent.dataTransfer
            });
            target.dispatchEvent(dragEnterEvent);

            const dragOverEvent = new DragEvent('dragover', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dragStartEvent.dataTransfer
            });
            target.dispatchEvent(dragOverEvent);

            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dragStartEvent.dataTransfer
            });
            target.dispatchEvent(dropEvent);

            const dragEndEvent = new DragEvent('dragend', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dragStartEvent.dataTransfer
            });
            source.dispatchEvent(dragEndEvent);
        }, {
            sourceLabel: '6',
            targetLabel: '9'
        });

        await page.waitForTimeout(500);

        // Verify that the actions moved with the key
        const newActions = await page.evaluate(() => {
            const keyIndex = state.config.defsrc.indexOf('6');
            const result = {};
            for (const layerName in state.config.layers) {
                result[layerName] = state.config.layers[layerName][keyIndex];
            }
            return { keyIndex, actions: result };
        });

        console.log('New 6 index and actions:', newActions);

        // The actions should be the same, just at a different index
        expect(newActions.actions).toEqual(initialActions.actions);
        expect(newActions.keyIndex).not.toBe(initialActions.keyIndex);
    });

    test('should handle dragging key to the left', async ({ page }) => {
        // Enable layout edit mode
        await page.click('#layoutEditBtn');
        await page.waitForTimeout(500);

        // Get initial order
        const initialOrder = await page.evaluate(() => {
            return state.config.defsrc.slice();
        });

        console.log('Initial order:', initialOrder);

        // Drag '7' key to '4' key position (left drag)
        const sourceKey = page.locator('.key').filter({ has: page.locator('.key-label:text-is("7")') }).first();
        const targetKey = page.locator('.key').filter({ has: page.locator('.key-label:text-is("4")') }).first();

        // Verify keys exist
        await expect(sourceKey).toBeVisible();
        await expect(targetKey).toBeVisible();

        // Manual drag simulation
        await page.evaluate(async ({ sourceLabel, targetLabel }) => {
            const allKeys = Array.from(document.querySelectorAll('.key'));
            const source = allKeys.find(key => {
                const label = key.querySelector('.key-label');
                return label && label.textContent.trim() === sourceLabel;
            });
            const target = allKeys.find(key => {
                const label = key.querySelector('.key-label');
                return label && label.textContent.trim() === targetLabel;
            });

            const dragStartEvent = new DragEvent('dragstart', {
                bubbles: true,
                cancelable: true,
                dataTransfer: new DataTransfer()
            });
            source.dispatchEvent(dragStartEvent);

            const dragEnterEvent = new DragEvent('dragenter', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dragStartEvent.dataTransfer
            });
            target.dispatchEvent(dragEnterEvent);

            const dragOverEvent = new DragEvent('dragover', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dragStartEvent.dataTransfer
            });
            target.dispatchEvent(dragOverEvent);

            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dragStartEvent.dataTransfer
            });
            target.dispatchEvent(dropEvent);

            const dragEndEvent = new DragEvent('dragend', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dragStartEvent.dataTransfer
            });
            source.dispatchEvent(dragEndEvent);
        }, {
            sourceLabel: '7',
            targetLabel: '4'
        });

        await page.waitForTimeout(500);

        // Get new order
        const newOrder = await page.evaluate(() => {
            return state.config.defsrc.slice();
        });

        console.log('New order after left drag:', newOrder);

        const initial7Index = initialOrder.indexOf('7');
        const initial4Index = initialOrder.indexOf('4');

        console.log('Initial 7 at:', initial7Index, 'Initial 4 at:', initial4Index);
        console.log('New order at initial 4 position:', newOrder[initial4Index]);

        // 7 should now be at 4's position
        expect(newOrder[initial4Index]).toBe('7');
        expect(newOrder).not.toEqual(initialOrder);
    });
});
