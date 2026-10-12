import type { Metadata } from 'next';
import { AppDocument } from '../AppDocument';
import { baseMetadata } from '../seo';
import { defaultLocale } from '@/i18n/messages';

export const metadata: Metadata = baseMetadata;

export default function DefaultLocaleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppDocument lang={defaultLocale}>{children}</AppDocument>;
}
