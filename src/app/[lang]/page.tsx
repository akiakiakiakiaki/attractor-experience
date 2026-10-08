import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LocalizedHome } from '../components/home-experience/LocalizedHome';
import { isLocale, locales, messages } from '@/i18n/messages';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type LocalizedPageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: LocalizedPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return {
    title: messages[lang].pageTitle,
    description: messages[lang].description,
  };
}

export default async function LocalizedPage({ params }: LocalizedPageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <LocalizedHome locale={lang} />;
}
