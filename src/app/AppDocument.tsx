import type { ReactNode } from 'react';
import { preload } from 'react-dom';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeRegistry } from './ThemeRegistry';
import './globals.scss';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');

export function AppDocument({
  children,
  lang,
}: Readonly<{ children: ReactNode; lang: string }>) {
  preload(`${basePath}/fonts/Lato-Regular.woff2`, {
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  });

  return (
    <html lang={lang} suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="dark" />
        <AppRouterCacheProvider>
          <ThemeRegistry>{children}</ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
