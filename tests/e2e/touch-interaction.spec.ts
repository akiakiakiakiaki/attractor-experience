import { expect, test } from '@playwright/test';

test.describe('Attractor touch interaction', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  test('a touch tap activates the wordmark envelope', async ({ page }) => {
    await page.goto('/en/');

    const canvas = page.getByTestId('attractor-canvas');
    const claim = page.getByTestId('attractor-claim');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveCSS('touch-action', 'none');

    const bounds = await canvas.boundingBox();
    expect(bounds).not.toBeNull();
    await page.touchscreen.tap(
      bounds!.x + bounds!.width / 2,
      bounds!.y + bounds!.height / 2,
    );

    await expect.poll(async () =>
      Number(await claim.evaluate((element) => element.style.opacity)),
    ).toBeGreaterThan(0.01);
  });

  test('canvas touch gestures stay with the stage and cancel native touch defaults', async ({
    page,
    context,
  }) => {
    await page.goto('/en/');

    const canvas = page.getByTestId('attractor-canvas');
    const bounds = await canvas.boundingBox();
    expect(bounds).not.toBeNull();

    await page.evaluate(() => {
      const target = document.querySelector<HTMLCanvasElement>('[data-testid="attractor-canvas"]');
      if (!target) throw new Error('Attractor canvas not found');

      const testWindow = window as Window & {
        __touchEvents?: string[];
        __touchStartPrevented?: boolean;
      };
      testWindow.__touchEvents = [];
      target.addEventListener('pointerdown', () => testWindow.__touchEvents?.push('down'));
      target.addEventListener('pointermove', () => testWindow.__touchEvents?.push('move'));
      target.addEventListener('pointerup', () => testWindow.__touchEvents?.push('up'));
      target.addEventListener('pointercancel', () => testWindow.__touchEvents?.push('cancel'));
      target.addEventListener('touchstart', (event) => {
        testWindow.__touchStartPrevented = event.defaultPrevented;
      });
    });

    const x = bounds!.x + bounds!.width / 2;
    const y = bounds!.y + bounds!.height / 2;
    const session = await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 1, x, y }],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ id: 1, x: x + 32, y: y + 24 }],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });

    const state = await page.evaluate(() => {
      const testWindow = window as Window & {
        __touchEvents?: string[];
        __touchStartPrevented?: boolean;
      };
      return {
        events: testWindow.__touchEvents ?? [],
        touchStartPrevented: testWindow.__touchStartPrevented ?? false,
        scrollY: window.scrollY,
      };
    });

    expect(state.events).toContain('down');
    expect(state.events).toContain('move');
    expect(state.events).toContain('up');
    expect(state.events).not.toContain('cancel');
    expect(state.touchStartPrevented).toBe(true);
    expect(state.scrollY).toBe(0);
  });
});
