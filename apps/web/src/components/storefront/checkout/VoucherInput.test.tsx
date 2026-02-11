import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from '../../../../tests/render-with-intl';
import { useCartStore } from '@/stores/cartStore';
import { VoucherInput } from './VoucherInput';

describe('VoucherInput', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [{ productId: '1', name: 'A', image: '/a.jpg', price: 200000, quantity: 1, maxQuantity: 10 }],
      voucherCode: null,
      voucherDiscount: 0,
    });
  });

  it('should render voucher input and apply button', () => {
    renderWithIntl(<VoucherInput />);
    expect(screen.getByPlaceholderText('Nhap ma giam gia')).toBeInTheDocument();
    expect(screen.getByText('Ap dung')).toBeInTheDocument();
  });

  it('should disable apply button when input is empty', () => {
    renderWithIntl(<VoucherInput />);
    const button = screen.getByText('Ap dung');
    expect(button).toBeDisabled();
  });

  it('should enable apply button when input has text', async () => {
    const user = userEvent.setup();
    renderWithIntl(<VoucherInput />);

    await user.type(screen.getByPlaceholderText('Nhap ma giam gia'), 'SAVE50K');
    expect(screen.getByText('Ap dung')).not.toBeDisabled();
  });

  it('should show applied voucher code when voucher is active', () => {
    useCartStore.setState({
      items: [{ productId: '1', name: 'A', image: '/a.jpg', price: 200000, quantity: 1, maxQuantity: 10 }],
      voucherCode: 'SAVE50K',
      voucherDiscount: 50000,
    });

    renderWithIntl(<VoucherInput />);
    expect(screen.getByText('SAVE50K')).toBeInTheDocument();
    expect(screen.getByLabelText('Xoa ma giam gia')).toBeInTheDocument();
  });
});
