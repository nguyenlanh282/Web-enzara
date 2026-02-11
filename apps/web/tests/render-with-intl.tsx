import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import viMessages from '../src/messages/vi.json';
import enMessages from '../src/messages/en.json';

const messages: Record<string, Record<string, unknown>> = {
  vi: viMessages,
  en: enMessages,
};

interface IntlRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: 'vi' | 'en';
}

export function renderWithIntl(
  ui: React.ReactElement,
  { locale = 'vi', ...options }: IntlRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        {children}
      </NextIntlClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
