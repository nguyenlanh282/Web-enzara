import { generatePageMetadata, productJsonLd } from './seo';

describe('generatePageMetadata', () => {
  it('should generate metadata with correct title and description', () => {
    const meta = generatePageMetadata({
      title: 'Test Page',
      description: 'Test description',
      path: '/test',
    });

    expect(meta.title).toBe('Test Page');
    expect(meta.description).toBe('Test description');
  });

  it('should default to vi locale in canonical URL', () => {
    const meta = generatePageMetadata({
      title: 'T',
      description: 'D',
      path: '/products',
    });

    expect(meta.alternates?.canonical).toContain('/vi/products');
  });

  it('should use provided locale in canonical URL', () => {
    const meta = generatePageMetadata({
      title: 'T',
      description: 'D',
      path: '/products',
      locale: 'en',
    });

    expect(meta.alternates?.canonical).toContain('/en/products');
  });

  it('should include noIndex when specified', () => {
    const meta = generatePageMetadata({
      title: 'T',
      description: 'D',
      path: '/admin',
      noIndex: true,
    });

    expect((meta.robots as any)?.index).toBe(false);
  });

  it('should not include robots when noIndex is not set', () => {
    const meta = generatePageMetadata({
      title: 'T',
      description: 'D',
      path: '/p',
    });

    expect(meta.robots).toBeUndefined();
  });

  it('should include OG image when provided', () => {
    const meta = generatePageMetadata({
      title: 'T',
      description: 'D',
      path: '/p',
      image: 'https://enzara.vn/og.jpg',
    });

    expect((meta.openGraph as any)?.images).toHaveLength(1);
    expect((meta.openGraph as any)?.images[0].url).toBe('https://enzara.vn/og.jpg');
  });

  it('should have empty OG images when no image provided', () => {
    const meta = generatePageMetadata({
      title: 'T',
      description: 'D',
      path: '/p',
    });

    expect((meta.openGraph as any)?.images).toHaveLength(0);
  });

  it('should include alternate languages', () => {
    const meta = generatePageMetadata({
      title: 'T',
      description: 'D',
      path: '/products',
    });

    expect((meta.alternates as any)?.languages?.vi).toContain('/vi/products');
    expect((meta.alternates as any)?.languages?.en).toContain('/en/products');
  });
});

describe('productJsonLd', () => {
  it('should generate valid product JSON-LD', () => {
    const jsonLd = productJsonLd({
      name: 'Test Product',
      shortDesc: 'Short description',
      basePrice: 100000,
      stockQuantity: 10,
      slug: 'test-product',
    });

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('Product');
    expect(jsonLd.name).toBe('Test Product');
    expect(jsonLd.offers.priceCurrency).toBe('VND');
    expect(jsonLd.offers.price).toBe(100000);
    expect(jsonLd.offers.availability).toBe('https://schema.org/InStock');
  });

  it('should use salePrice over basePrice when available', () => {
    const jsonLd = productJsonLd({
      name: 'Sale Product',
      basePrice: 200000,
      salePrice: 150000,
      stockQuantity: 5,
      slug: 'sale-product',
    });

    expect(jsonLd.offers.price).toBe(150000);
  });

  it('should show OutOfStock when stockQuantity is 0', () => {
    const jsonLd = productJsonLd({
      name: 'OOS Product',
      basePrice: 100000,
      stockQuantity: 0,
      slug: 'oos-product',
    });

    expect(jsonLd.offers.availability).toBe('https://schema.org/OutOfStock');
  });

  it('should include brand when provided', () => {
    const jsonLd = productJsonLd({
      name: 'Branded',
      basePrice: 100000,
      stockQuantity: 1,
      slug: 'branded',
      brand: { name: 'Enzara' },
    });

    expect(jsonLd.brand).toEqual({ '@type': 'Brand', name: 'Enzara' });
  });

  it('should include aggregateRating when avgRating > 0', () => {
    const jsonLd = productJsonLd({
      name: 'Rated',
      basePrice: 100000,
      stockQuantity: 1,
      slug: 'rated',
      avgRating: 4.5,
      reviews: [{}, {}, {}],
    });

    expect(jsonLd.aggregateRating).toBeDefined();
    expect(jsonLd.aggregateRating?.ratingValue).toBe(4.5);
    expect(jsonLd.aggregateRating?.reviewCount).toBe(3);
  });
});
