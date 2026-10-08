'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';

export function ThemeRegistry({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme} defaultMode="dark">{children}</ThemeProvider>;
}
