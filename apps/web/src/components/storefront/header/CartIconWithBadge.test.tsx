import { describe, it, expect, beforeEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import { renderWithIntl } from '../../../../tests/render-with-intl';
import { useCartStore } from '@/stores/cartStore';
import { CartIconWithBadge } from './CartIconWithBadge';
import { vi } from 'vitest';

vi.mock('@/components/storefront/cart/CartDrawer', () => ({
  CartDrawer: () => null,
}));

describe('CartIconWithBadge', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], voucherCode: null, voucherDiscount: 0 });
  });

  it('should render cart button', () => {
    renderWithIntl(<CartIconWithBadge />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should not show badge when cart is empty', async () => {
    renderWithIntl(<CartIconWithBadge />);
    // Wait for mounted state to be set
    await act(async () => {});
    // Badge should not be present when cart is empty
    const badge = document.querySelector('span.absolute');
    expect(badge).toBeNull();
  });

  it('should show badge with correct count', async () => {
    useCartStore.setState({
      items: [
        { productId: '1', name: 'A', image: '/a.jpg', price: 100000, quantity: 2, maxQuantity: 10 },
        { productId: '2', name: 'B', image: '/b.jpg', price: 50000, quantity: 1, maxQuantity: 10 },
      ],
      voucherCode: null,
      voucherDiscount: 0,
    });

    renderWithIntl(<CartIconWithBadge />);
    await act(async () => {});
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
