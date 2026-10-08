import type { Metadata } from 'next';
import { preload } from 'react-dom';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeRegistry } from './ThemeRegistry';
import './globals.scss';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Michael Ilg — Frontend Architect',
  description: 'An interactive field exploring systems, interfaces and movement.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  preload(`${basePath}/fonts/Lato-Regular.woff2`, {
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="dark" />
        <AppRouterCacheProvider>
          <ThemeRegistry>{children}</ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
