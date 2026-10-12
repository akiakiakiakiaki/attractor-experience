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

  test('receives two independent touch pointers for pinch and rotation gestures', async ({
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
        __multiTouchPointers?: Array<{ type: string; id: number; pointerType: string }>;
      };
      testWindow.__multiTouchPointers = [];
      for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
        target.addEventListener(type, (event) => {
          const pointer = event as PointerEvent;
          testWindow.__multiTouchPointers?.push({
            type,
            id: pointer.pointerId,
            pointerType: pointer.pointerType,
          });
        });
      }
    });

    const centerX = bounds!.x + bounds!.width / 2;
    const centerY = bounds!.y + bounds!.height / 2;
    const session = await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { id: 1, x: centerX - 24, y: centerY },
        { id: 2, x: centerX + 24, y: centerY },
      ],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { id: 1, x: centerX - 42, y: centerY - 8 },
        { id: 2, x: centerX + 42, y: centerY + 8 },
      ],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { id: 1, x: centerX - 42, y: centerY + 8 },
        { id: 2, x: centerX + 42, y: centerY - 8 },
      ],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });

    const pointerEvents = await page.evaluate(() =>
      (window as Window & {
        __multiTouchPointers?: Array<{ type: string; id: number; pointerType: string }>;
      }).__multiTouchPointers ?? [],
    );
    const touchPointerIds = [...new Set(
      pointerEvents.filter(({ type }) => type === 'pointerdown').map(({ id }) => id),
    )];
    const movingPointerIds = [...new Set(
      pointerEvents.filter(({ type }) => type === 'pointermove').map(({ id }) => id),
    )];

    expect(touchPointerIds).toHaveLength(2);
    expect(movingPointerIds).toHaveLength(2);
    expect(pointerEvents.every(({ pointerType }) => pointerType === 'touch')).toBe(true);
    expect(pointerEvents.some(({ type }) => type === 'pointercancel')).toBe(false);
  });
});
