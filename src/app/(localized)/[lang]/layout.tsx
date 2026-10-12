import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppDocument } from '../../AppDocument';
import { baseMetadata } from '../../seo';
import { isLocale } from '@/i18n/messages';

export const metadata: Metadata = baseMetadata;

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return <AppDocument lang={lang}>{children}</AppDocument>;
}
