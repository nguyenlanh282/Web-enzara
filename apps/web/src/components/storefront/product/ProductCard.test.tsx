import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from '../../../../tests/render-with-intl';
import { ProductCard } from './ProductCard';

const mockProduct = {
  name: 'Nuoc rua chen huu co',
  slug: 'nuoc-rua-chen-huu-co',
  basePrice: 350000,
  images: [{ url: '/images/product.jpg', altText: 'Nuoc rua chen' }],
};

describe('ProductCard', () => {
  it('should render product name', () => {
    renderWithIntl(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Nuoc rua chen huu co')).toBeInTheDocument();
  });

  it('should render formatted price', () => {
    renderWithIntl(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/350\.000/)).toBeInTheDocument();
  });

  it('should render product image with alt text', () => {
    renderWithIntl(<ProductCard product={mockProduct} />);
    const img = screen.getByAltText('Nuoc rua chen');
    expect(img).toBeInTheDocument();
  });

  it('should show sale price and original price when on sale', () => {
    const saleProduct = { ...mockProduct, salePrice: 280000 };
    renderWithIntl(<ProductCard product={saleProduct} />);
    expect(screen.getByText(/280\.000/)).toBeInTheDocument();
    expect(screen.getByText(/350\.000/)).toBeInTheDocument();
  });

  it('should show discount badge when on sale', () => {
    const saleProduct = { ...mockProduct, salePrice: 280000 };
    renderWithIntl(<ProductCard product={saleProduct} />);
    expect(screen.getByText(/-20%/)).toBeInTheDocument();
  });

  it('should show featured badge when isFeatured', () => {
    const featuredProduct = { ...mockProduct, isFeatured: true };
    renderWithIntl(<ProductCard product={featuredProduct} />);
    expect(screen.getByText('Noi bat')).toBeInTheDocument();
  });

  it('should link to product detail page', () => {
    renderWithIntl(<ProductCard product={mockProduct} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/products/nuoc-rua-chen-huu-co');
  });
});
