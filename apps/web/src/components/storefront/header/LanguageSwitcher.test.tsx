import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from '../../../../tests/render-with-intl';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useRouter } from '@/i18n/navigation';

describe('LanguageSwitcher', () => {
  it('should render a button with aria-label', () => {
    renderWithIntl(<LanguageSwitcher />, { locale: 'vi' });
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to EN');
  });

  it('should show the other locale label when current is vi', () => {
    renderWithIntl(<LanguageSwitcher />, { locale: 'vi' });
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('should show VI when current locale is en', () => {
    renderWithIntl(<LanguageSwitcher />, { locale: 'en' });
    expect(screen.getByText('VI')).toBeInTheDocument();
  });

  it('should call router.replace on click', async () => {
    const mockReplace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: mockReplace,
      prefetch: vi.fn(),
      back: vi.fn(),
    } as any);

    const user = userEvent.setup();
    renderWithIntl(<LanguageSwitcher />, { locale: 'vi' });
    await user.click(screen.getByRole('button'));

    expect(mockReplace).toHaveBeenCalledWith('/', { locale: 'en' });
  });
});
