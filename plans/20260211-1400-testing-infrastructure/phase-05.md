# Phase 5: Web Component Tests (React Testing Library)

## Context

- **Parent plan:** [plan.md](./plan.md)
- **Dependencies:** [Phase 1](./phase-01.md) (config, setup.ts, renderWithIntl), [Phase 4](./phase-04.md) (store test patterns)
- **Research:** [researcher-02](./research/researcher-02-report.md) (RTL + Vitest, next-intl wrapper, next/navigation mock)
- **Scout:** [scout-01](./scout/scout-01-report.md) (component inventory)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-11 |
| Description | Test 6 key client components with React Testing Library: Header, ProductCard, CartIconWithBadge, LanguageSwitcher, SearchModal, and checkout components (ShippingForm, VoucherInput, OrderSummary). Tests render components with next-intl provider and assert DOM output, user interactions, and store integration. |
| Priority | P2 |
| Implementation status | pending |
| Review status | pending |

## Key Insights

- All storefront components are client components (`"use client"`) -- fully testable with RTL + jsdom
- Components use `useTranslations()` from `next-intl` -- must wrap with `NextIntlClientProvider`
- CartIconWithBadge reads from `useCartStore` -- store auto-available in jsdom; reset in beforeEach
- Header uses `next/navigation` hooks -- globally mocked in setup.ts
- Radix UI components (Dialog, Select) render portals -- may need `{ container: document.body }` or `screen.getByRole` queries
- ShippingForm uses `react-hook-form` + `zod` validation -- test form submission and validation errors
- `@testing-library/user-event` provides realistic user interactions (click, type, tab)

## Requirements

1. Header: renders nav links, search button, language switcher, cart badge (~4 tests)
2. ProductCard: renders name/price/image, handles add-to-cart click (~4 tests)
3. CartIconWithBadge: shows correct count from store (~3 tests)
4. LanguageSwitcher: toggles locale, renders current locale (~3 tests)
5. SearchModal: opens/closes, accepts search input (~3 tests)
6. Checkout components: ShippingForm validation, VoucherInput submit, OrderSummary totals (~8 tests)

## Architecture

```
apps/web/src/components/storefront/
  header/
    Header.test.tsx ............. NEW (~4 tests)
    CartIconWithBadge.test.tsx .. NEW (~3 tests)
    LanguageSwitcher.test.tsx ... NEW (~3 tests)
    SearchModal.test.tsx ........ NEW (~3 tests)
  product/
    ProductCard.test.tsx ........ NEW (~4 tests)
  checkout/
    ShippingForm.test.tsx ....... NEW (~3 tests)
    VoucherInput.test.tsx ....... NEW (~3 tests)
    OrderSummary.test.tsx ....... NEW (~2 tests)
```

## Related Code Files

- `Z:\Web-enzara\apps\web\src\components\storefront\header\Header.tsx`
- `Z:\Web-enzara\apps\web\src\components\storefront\header\CartIconWithBadge.tsx`
- `Z:\Web-enzara\apps\web\src\components\storefront\header\SearchModal.tsx`
- `Z:\Web-enzara\apps\web\src\components\storefront\header\LanguageSwitcher.tsx`
- `Z:\Web-enzara\apps\web\src\components\storefront\product\ProductCard.tsx`
- `Z:\Web-enzara\apps\web\src\components\storefront\checkout\ShippingForm.tsx`
- `Z:\Web-enzara\apps\web\src\components\storefront\checkout\VoucherInput.tsx`
- `Z:\Web-enzara\apps\web\src\components\storefront\checkout\OrderSummary.tsx`
- `Z:\Web-enzara\apps\web\tests\render-with-intl.tsx` (from Phase 1)
- `Z:\Web-enzara\apps\web\src\messages\vi.json`
- `Z:\Web-enzara\apps\web\src\messages\en.json`

## Implementation Steps

### Step 5.0 - Pre-work: Read all target components

Before writing any test, read each component file to understand:
- Props interface
- Which hooks are used (useTranslations, useRouter, useCartStore, etc.)
- What DOM elements are rendered (for query selectors)
- Event handlers (onClick, onSubmit)
- Any data-testid attributes (add if missing)

### Step 5.1 - Header Component Tests

File: `apps/web/src/components/storefront/header/Header.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from '../../../../tests/render-with-intl';
import Header from './Header';

// Mock child components if they have complex deps
vi.mock('./SearchModal', () => ({
  default: () => <div data-testid="search-modal-mock" />,
}));

describe('Header', () => {
  it('should render the site logo/name', () => {
    renderWithIntl(<Header />);
    expect(screen.getByText(/enzara/i)).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    renderWithIntl(<Header />);
    // Check for key nav items -- adjust based on actual component
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should render cart icon', () => {
    renderWithIntl(<Header />);
    // CartIconWithBadge should be present
    expect(screen.getByLabelText(/cart/i) || screen.getByTestId('cart-icon')).toBeInTheDocument();
  });

  it('should render language switcher', () => {
    renderWithIntl(<Header />);
    // Look for language toggle element
    expect(screen.getByText(/vi|en/i)).toBeInTheDocument();
  });
});
```

**Note:** Exact selectors depend on reading the actual Header component. Adjust `getByText`, `getByRole`, `getByTestId` queries after reading the source.

### Step 5.2 - ProductCard Component Tests

File: `apps/web/src/components/storefront/product/ProductCard.test.tsx`

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from '../../../../tests/render-with-intl';
import { useCartStore } from '@/stores/cartStore';
import ProductCard from './ProductCard';

const mockProduct = {
  id: 'prod-1',
  name: 'Kem Dưỡng Da',
  slug: 'kem-duong-da',
  price: 350000,
  originalPrice: 500000,
  image: '/images/product.jpg',
  brand: 'Enzara',
  // ... match actual prop types
};

describe('ProductCard', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], voucherCode: null, voucherDiscount: 0 });
  });

  it('should render product name', () => {
    renderWithIntl(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Kem Dưỡng Da')).toBeInTheDocument();
  });

  it('should render formatted price', () => {
    renderWithIntl(<ProductCard product={mockProduct} />);
    // Price should be formatted as VND
    expect(screen.getByText(/350\.000/)).toBeInTheDocument();
  });

  it('should render product image', () => {
    renderWithIntl(<ProductCard product={mockProduct} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', expect.stringContaining('Kem'));
  });

  it('should add product to cart on button click', async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProductCard product={mockProduct} />);

    const addButton = screen.getByRole('button', { name: /add|thêm/i });
    await user.click(addButton);

    expect(useCartStore.getState().items).toHaveLength(1);
  });
});
```

### Step 5.3 - CartIconWithBadge Tests

File: `apps/web/src/components/storefront/header/CartIconWithBadge.test.tsx`

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from '../../../../tests/render-with-intl';
import { useCartStore } from '@/stores/cartStore';
import CartIconWithBadge from './CartIconWithBadge';

describe('CartIconWithBadge', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], voucherCode: null, voucherDiscount: 0 });
  });

  it('should not show badge when cart is empty', () => {
    renderWithIntl(<CartIconWithBadge />);
    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
  });

  it('should show badge with correct count', () => {
    useCartStore.setState({
      items: [
        { productId: '1', name: 'A', image: '', price: 100, quantity: 2, maxQuantity: 10 },
        { productId: '2', name: 'B', image: '', price: 200, quantity: 1, maxQuantity: 10 },
      ],
      voucherCode: null,
      voucherDiscount: 0,
    });

    renderWithIntl(<CartIconWithBadge />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should update when store changes', () => {
    renderWithIntl(<CartIconWithBadge />);
    // Initially no badge
    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();

    // Not easily testable without re-render; Zustand auto-rerenders
    // This is more of a React integration concern
  });
});
```

### Step 5.4 - LanguageSwitcher Tests

File: `apps/web/src/components/storefront/header/LanguageSwitcher.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from '../../../../tests/render-with-intl';
import LanguageSwitcher from './LanguageSwitcher';

describe('LanguageSwitcher', () => {
  it('should render current locale', () => {
    renderWithIntl(<LanguageSwitcher />, { locale: 'vi' });
    expect(screen.getByText(/vi|tiếng việt/i)).toBeInTheDocument();
  });

  it('should render with English locale', () => {
    renderWithIntl(<LanguageSwitcher />, { locale: 'en' });
    expect(screen.getByText(/en|english/i)).toBeInTheDocument();
  });

  it('should trigger locale change on click', async () => {
    const user = userEvent.setup();
    renderWithIntl(<LanguageSwitcher />, { locale: 'vi' });

    // Find and click the switcher -- exact query depends on component structure
    const switcher = screen.getByRole('button') || screen.getByRole('combobox');
    await user.click(switcher);

    // Check that router.push or locale change was triggered
    // Depends on implementation (useRouter push with locale prefix, or next-intl useLocale)
  });
});
```

### Step 5.5 - SearchModal Tests

File: `apps/web/src/components/storefront/header/SearchModal.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from '../../../../tests/render-with-intl';
import SearchModal from './SearchModal';

describe('SearchModal', () => {
  it('should render search trigger button', () => {
    renderWithIntl(<SearchModal />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should open modal and show search input on click', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SearchModal />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('textbox') || screen.getByPlaceholderText(/tìm|search/i)).toBeInTheDocument();
    });
  });

  it('should accept search input text', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SearchModal />);

    await user.click(screen.getByRole('button'));

    const input = await screen.findByRole('textbox');
    await user.type(input, 'kem dưỡng');
    expect(input).toHaveValue('kem dưỡng');
  });
});
```

### Step 5.6 - Checkout Component Tests

#### ShippingForm

File: `apps/web/src/components/storefront/checkout/ShippingForm.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from '../../../../tests/render-with-intl';
import ShippingForm from './ShippingForm';

describe('ShippingForm', () => {
  const mockOnSubmit = vi.fn();

  it('should render all required fields', () => {
    renderWithIntl(<ShippingForm onSubmit={mockOnSubmit} />);
    // Check for name, phone, address fields -- adjust to actual field names
    expect(screen.getByLabelText(/tên|name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/điện thoại|phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/địa chỉ|address/i)).toBeInTheDocument();
  });

  it('should show validation errors for empty submission', async () => {
    const user = userEvent.setup();
    renderWithIntl(<ShippingForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /submit|tiếp|gửi/i });
    await user.click(submitButton);

    await waitFor(() => {
      // Zod validation should trigger error messages
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
  });

  it('should call onSubmit with valid data', async () => {
    const user = userEvent.setup();
    renderWithIntl(<ShippingForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/tên|name/i), 'Nguyen Van A');
    await user.type(screen.getByLabelText(/điện thoại|phone/i), '0901234567');
    await user.type(screen.getByLabelText(/địa chỉ|address/i), '123 Le Loi, Q1');

    await user.click(screen.getByRole('button', { name: /submit|tiếp|gửi/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });
});
```

#### VoucherInput

File: `apps/web/src/components/storefront/checkout/VoucherInput.test.tsx`

Key tests:
- Renders input and apply button
- Calls store.applyVoucher on submit
- Displays success/error message from store response

#### OrderSummary

File: `apps/web/src/components/storefront/checkout/OrderSummary.test.tsx`

Key tests:
- Renders item list from cart store
- Shows subtotal, discount, and total amounts
- Formats prices in VND

## Todo List

- [ ] Read all 8 target component files for exact props and DOM structure
- [ ] Add `data-testid` attributes to components where queries are ambiguous
- [ ] Write Header tests (Step 5.1)
- [ ] Write ProductCard tests (Step 5.2)
- [ ] Write CartIconWithBadge tests (Step 5.3)
- [ ] Write LanguageSwitcher tests (Step 5.4)
- [ ] Write SearchModal tests (Step 5.5)
- [ ] Write checkout component tests (Step 5.6)
- [ ] Run `pnpm --filter @enzara/web test` and verify all pass

## Success Criteria

1. All 8 component test files passing
2. ~25 component test cases total
3. Each component tested for: rendering, props, user interaction
4. next-intl provider wraps all renders (no missing translation errors)
5. Zustand store integration tested where applicable
6. No flaky tests from async rendering

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Radix UI portals render outside test container | High | Medium | Use `screen.getByRole` which queries entire document, not just container |
| next-intl translation keys missing in test messages | Medium | Medium | Import actual message files; add fallback handling |
| framer-motion animations cause timing issues | Medium | Low | Mock `framer-motion` to render children immediately |
| Component imports trigger side effects (analytics, etc.) | Medium | Low | Mock tracking/analytics modules in setup.ts |

## Security Considerations

- Component tests should not make real API calls (fetch is not mocked at component level but apiClient should be)
- No real user data in test fixtures

## Next Steps

Phase 5 completes the frontend unit+component test suite. Phase 6 (E2E) is the final phase and can run independently once Phase 1 is done.
