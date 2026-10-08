'use client';

import { useEffect, useRef } from 'react';
import { VisuallyHidden } from '@/app/components/visually-hidden/VisuallyHidden';
import { AttractorRuntime } from './AttractorRuntime';
import styles from './AttractorField.module.scss';

export function AttractorField({ claim, canvasLabel }: { claim: string; canvasLabel: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const claimRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const claimElement = claimRef.current;
    if (!canvas || !host || !claimElement) return;

    const runtime = new AttractorRuntime(canvas, host, claimElement);
    return runtime.start();
  }, []);

  return (
    <div className={styles.host} ref={hostRef}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        data-testid="attractor-canvas"
        tabIndex={0}
        aria-label={canvasLabel}
      />
      <span
        className={styles.claim}
        data-testid="attractor-claim"
        ref={claimRef}
        aria-hidden="true"
        style={{ opacity: 0 }}
      >
        {claim}
      </span>
      <VisuallyHidden>Michael Ilg. {claim}.</VisuallyHidden>
    </div>
  );
}
