import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = fileURLToPath(new URL('../artifacts/profiling/', import.meta.url));
const port = 4174;
const baseURL = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['scripts/serve-static.mjs'], {
  cwd: projectRoot,
  env: { ...process.env, PORT: String(port) },
  stdio: 'inherit',
});

let browser;

async function waitForServer() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Static server exited with ${server.exitCode}`);
    try {
      const response = await fetch(`${baseURL}/en/`);
      if (response.ok) return;
    } catch {
      await delay(200);
    }
  }
  throw new Error(`Static server did not start at ${baseURL}`);
}

function summarizeFrameTimes(samples) {
  if (samples.length === 0) return { frameCount: 0, p50Ms: 0, p95Ms: 0, over20Ms: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  const percentile = (fraction) => sorted[Math.ceil(sorted.length * fraction) - 1] ?? 0;
  return {
    frameCount: samples.length,
    p50Ms: Number(percentile(0.5).toFixed(2)),
    p95Ms: Number(percentile(0.95).toFixed(2)),
    over20Ms: samples.filter((sample) => sample > 20).length,
  };
}

async function startFrameMeasurement(page) {
  await page.evaluate(() => {
    const state = { active: true, previous: 0, samples: [] };
    window.__frameMeasurement = state;
    const measure = (now) => {
      if (!state.active) return;
      if (state.previous > 0) state.samples.push(now - state.previous);
      state.previous = now;
      requestAnimationFrame(measure);
    };
    requestAnimationFrame(measure);
  });
}

async function stopFrameMeasurement(page) {
  return page.evaluate(() => {
    const state = window.__frameMeasurement;
    if (!state) return [];
    state.active = false;
    return state.samples;
  });
}

try {
  await mkdir(outputDirectory, { recursive: true });
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${baseURL}/en/`, { waitUntil: 'networkidle' });
  await page.locator('canvas').waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
  await delay(3_000);

  const traces = [];
  const scenarios = [
    {
      name: 'idle',
      durationMs: 10_000,
      interact: async () => {},
    },
    {
      name: 'cursor',
      durationMs: 8_000,
      interact: async () => {
        const start = Date.now();
        while (Date.now() - start < 7_000) {
          const progress = ((Date.now() - start) % 7_000) / 7_000;
          const x = 120 + progress * 1200;
          const y = 180 + Math.sin(progress * Math.PI * 4) * 260 + 350;
          await page.mouse.move(x, y);
          await delay(35);
        }
      },
    },
  ];

  for (const scenario of scenarios) {
    await startFrameMeasurement(page);
    const metricStartedAt = Date.now();
    await scenario.interact();
    const metricRemaining = scenario.durationMs - (Date.now() - metricStartedAt);
    if (metricRemaining > 0) await delay(metricRemaining);
    const frameTimes = await stopFrameMeasurement(page);

    const tracePath = fileURLToPath(new URL(`../artifacts/profiling/${scenario.name}.trace.json`, import.meta.url));
    await browser.startTracing(page, {
      path: tracePath,
      screenshots: false,
      categories: [
        'devtools.timeline',
        'disabled-by-default-devtools.timeline',
        'disabled-by-default-v8.cpu_profiler',
        'blink.user_timing',
        'cc',
        'gpu',
      ],
    });

    const startedAt = Date.now();
    await scenario.interact();
    const remaining = scenario.durationMs - (Date.now() - startedAt);
    if (remaining > 0) await delay(remaining);

    await browser.stopTracing();
    traces.push({
      scenario: scenario.name,
      durationMs: scenario.durationMs,
      frames: summarizeFrameTimes(frameTimes),
      tracePath,
    });
  }

  const reportPath = fileURLToPath(new URL('../artifacts/profiling/summary.json', import.meta.url));
  await writeFile(reportPath, `${JSON.stringify({
    browser: browser.version(),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    frameMetricsMethod: 'requestAnimationFrame intervals collected without an active Chromium trace',
    traces,
  }, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ reportPath, traces }, null, 2)}\n`);
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
