import { describe, it, expect, beforeEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import { renderWithIntl } from '../../../../tests/render-with-intl';
import { useCartStore } from '@/stores/cartStore';
import { OrderSummary } from './OrderSummary';

describe('OrderSummary', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [
        { productId: '1', name: 'Nuoc rua chen', image: '/a.jpg', price: 200000, quantity: 2, maxQuantity: 10 },
        { productId: '2', name: 'Nuoc giat', image: '/b.jpg', price: 150000, quantity: 1, maxQuantity: 10 },
      ],
      voucherCode: null,
      voucherDiscount: 0,
    });
  });

  it('should render order heading', async () => {
    renderWithIntl(<OrderSummary shippingFee={0} />);
    await act(async () => {});
    expect(screen.getByText('Don hang cua ban')).toBeInTheDocument();
  });

  it('should render item names', async () => {
    renderWithIntl(<OrderSummary shippingFee={0} />);
    await act(async () => {});
    expect(screen.getByText('Nuoc rua chen')).toBeInTheDocument();
    expect(screen.getByText('Nuoc giat')).toBeInTheDocument();
  });

  it('should show subtotal', async () => {
    renderWithIntl(<OrderSummary shippingFee={0} />);
    await act(async () => {});
    // Subtotal: 200000*2 + 150000*1 = 550000
    expect(screen.getByText('Tam tinh')).toBeInTheDocument();
    const priceElements = screen.getAllByText(/550\.000/);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it('should show voucher discount when applied', async () => {
    useCartStore.setState({
      items: [{ productId: '1', name: 'Product', image: '/a.jpg', price: 200000, quantity: 1, maxQuantity: 10 }],
      voucherCode: 'SAVE50K',
      voucherDiscount: 50000,
    });

    renderWithIntl(<OrderSummary shippingFee={0} />);
    await act(async () => {});
    expect(screen.getByText(/SAVE50K/)).toBeInTheDocument();
    expect(screen.getByText(/-50\.000/)).toBeInTheDocument();
  });

  it('should show free shipping when fee is 0', async () => {
    renderWithIntl(<OrderSummary shippingFee={0} />);
    await act(async () => {});
    expect(screen.getByText('Mien phi')).toBeInTheDocument();
  });

  it('should show address prompt when shipping fee is null', async () => {
    renderWithIntl(<OrderSummary shippingFee={null} />);
    await act(async () => {});
    expect(screen.getByText('Chon dia chi')).toBeInTheDocument();
  });
});
