import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from '../../../../tests/render-with-intl';
import { Header } from './Header';

vi.mock('./SearchModal', () => ({
  SearchModal: () => null,
}));

vi.mock('./MobileMenu', () => ({
  MobileMenu: () => null,
}));

vi.mock('./CartIconWithBadge', () => ({
  CartIconWithBadge: () => <span data-testid="cart-icon">cart</span>,
}));

vi.mock('./LanguageSwitcher', () => ({
  LanguageSwitcher: () => <span data-testid="lang-switcher">lang</span>,
}));

describe('Header', () => {
  it('should render the site logo', () => {
    renderWithIntl(<Header />);
    const logos = screen.getAllByText('Enzara');
    expect(logos.length).toBeGreaterThan(0);
  });

  it('should render navigation links from menus prop', () => {
    const menus = [
      { id: '1', label: 'San pham', href: '/products' },
      { id: '2', label: 'Lien he', href: '/contact' },
    ];
    renderWithIntl(<Header menus={menus} />);
    expect(screen.getByText('San pham')).toBeInTheDocument();
    expect(screen.getByText('Lien he')).toBeInTheDocument();
  });

  it('should render cart icon', () => {
    renderWithIntl(<Header />);
    expect(screen.getAllByTestId('cart-icon').length).toBeGreaterThan(0);
  });

  it('should render language switcher', () => {
    renderWithIntl(<Header />);
    expect(screen.getByTestId('lang-switcher')).toBeInTheDocument();
  });
});
