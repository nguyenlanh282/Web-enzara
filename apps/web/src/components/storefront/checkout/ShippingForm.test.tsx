import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from '../../../../tests/render-with-intl';
import { ShippingForm } from './ShippingForm';
import { useForm } from 'react-hook-form';
import type { CheckoutFormData } from './ShippingForm';
import Module from 'module';
import React from 'react';

// Mock the CJS require('@/lib/api') used by apiClient
const _require = Module.prototype.require;
(Module.prototype as any).require = function (id: string) {
  if (id === '@/stores/authStore') {
    return {
      useAuthStore: {
        getState: () => ({ accessToken: null, refreshToken: vi.fn() }),
      },
    };
  }
  return _require.apply(this, arguments as any);
};

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn().mockResolvedValue({}),
  },
}));

// Wrapper that provides react-hook-form context
function ShippingFormWrapper({ onAddressChange }: { onAddressChange?: (districtId: number, wardCode: string) => void }) {
  const form = useForm<CheckoutFormData>({
    defaultValues: {
      shippingName: '',
      shippingPhone: '',
      shippingEmail: '',
      shippingProvince: '',
      shippingDistrict: '',
      shippingWard: '',
      shippingAddress: '',
      note: '',
      paymentMethod: 'COD',
    },
  });
  return <ShippingForm form={form} onAddressChange={onAddressChange} />;
}

describe('ShippingForm', () => {
  it('should render name field', () => {
    renderWithIntl(<ShippingFormWrapper />);
    expect(screen.getByLabelText(/Ho va ten/)).toBeInTheDocument();
  });

  it('should render phone field', () => {
    renderWithIntl(<ShippingFormWrapper />);
    expect(screen.getByLabelText(/So dien thoai/)).toBeInTheDocument();
  });

  it('should render address field', () => {
    renderWithIntl(<ShippingFormWrapper />);
    expect(screen.getByLabelText(/Dia chi chi tiet/)).toBeInTheDocument();
  });

  it('should render province, district, ward selects', () => {
    renderWithIntl(<ShippingFormWrapper />);
    expect(screen.getByLabelText(/Tinh\/Thanh pho/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quan\/Huyen/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phuong\/Xa/)).toBeInTheDocument();
  });

  it('should render note field', () => {
    renderWithIntl(<ShippingFormWrapper />);
    expect(screen.getByLabelText(/Ghi chu/)).toBeInTheDocument();
  });
});
