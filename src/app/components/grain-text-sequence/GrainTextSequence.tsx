"use client";

import { useEffect, useState } from "react";
import styles from './GrainTextSequence.module.scss';
import { VisuallyHidden } from '../visually-hidden/VisuallyHidden';

type GrainPhase = "hidden" | "enter" | "hold" | "exit";

const GRAIN_TRANSITION_MS = 1000;

interface GrainTextSequenceProps {
  lines: string[];
  visibleDurationSeconds?: number;
}

export function GrainTextSequence({
  lines,
  visibleDurationSeconds = 10,
}: GrainTextSequenceProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<GrainPhase>("hidden");
  const [reducedMotion, setReducedMotion] = useState(false);
  const currentIndex = lines.length > 0 ? activeIndex % lines.length : 0;

  useEffect(() => {
    if (lines.length === 0) return;

    if (reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timerDuration = phase === "enter"
      ? GRAIN_TRANSITION_MS
      : phase === "hold"
        ? Math.max(0, visibleDurationSeconds * 1000)
        : phase === "exit"
          ? GRAIN_TRANSITION_MS
          : 0;

    const timer = window.setTimeout(() => {
      if (phase === "hidden") {
        setPhase("enter");
      } else if (phase === "enter") {
        setPhase("hold");
      } else if (phase === "hold") {
        setPhase("exit");
      } else {
        setActiveIndex((index) => (index + 1) % lines.length);
        setPhase("enter");
      }
    }, timerDuration);

    return () => window.clearTimeout(timer);
  }, [activeIndex, lines.length, phase, reducedMotion, visibleDurationSeconds]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = () => {
      setReducedMotion(reducedMotion.matches);
      if (!reducedMotion.matches) {
        setActiveIndex(0);
        setPhase("enter");
      }
    };

    reducedMotion.addEventListener("change", handleMotionChange);
    return () => reducedMotion.removeEventListener("change", handleMotionChange);
  }, []);

  return (
    <>
      <div className={styles.annotation} aria-hidden="true">
        {lines.map((line, index) => {
          const linePhase = index === currentIndex ? phase : "hidden";
          return (
            <span
              className={styles.line}
              data-phase={linePhase}
              key={`${index}-${line}`}
              style={linePhase === "hidden" ? { opacity: 0 } : undefined}
            >
              {line}
            </span>
          );
        })}
      </div>
      <VisuallyHidden>{lines.join(". ")}</VisuallyHidden>
    </>
  );
}
