import { useCartStore, selectSubtotal, selectTotalItems, selectTotal, CartItem } from './cartStore';

vi.mock('@/lib/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockItem: Omit<CartItem, 'quantity'> = {
  productId: 'prod-1',
  name: 'Test Product',
  image: '/img.jpg',
  price: 100000,
  maxQuantity: 10,
};

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      voucherCode: null,
      voucherDiscount: 0,
    });
  });

  describe('addItem', () => {
    it('should add new item to empty cart', () => {
      useCartStore.getState().addItem(mockItem);
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('prod-1');
      expect(items[0].quantity).toBe(1);
    });

    it('should increment quantity for existing item', () => {
      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().addItem(mockItem);
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it('should clamp quantity to maxQuantity', () => {
      useCartStore.getState().addItem({ ...mockItem, maxQuantity: 2 });
      useCartStore.getState().addItem({ ...mockItem, maxQuantity: 2 });
      useCartStore.getState().addItem({ ...mockItem, maxQuantity: 2 });
      const { items } = useCartStore.getState();
      expect(items[0].quantity).toBe(2);
    });

    it('should treat different variantIds as separate items', () => {
      useCartStore.getState().addItem({ ...mockItem, variantId: 'v1' });
      useCartStore.getState().addItem({ ...mockItem, variantId: 'v2' });
      expect(useCartStore.getState().items).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('should remove item by productId', () => {
      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().removeItem('prod-1');
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should remove correct variant', () => {
      useCartStore.getState().addItem({ ...mockItem, variantId: 'v1' });
      useCartStore.getState().addItem({ ...mockItem, variantId: 'v2' });
      useCartStore.getState().removeItem('prod-1', 'v1');
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].variantId).toBe('v2');
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity for matching item', () => {
      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().updateQuantity('prod-1', undefined, 5);
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('should remove item when quantity set to 0', () => {
      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().updateQuantity('prod-1', undefined, 0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should clamp to maxQuantity', () => {
      useCartStore.getState().addItem({ ...mockItem, maxQuantity: 3 });
      useCartStore.getState().updateQuantity('prod-1', undefined, 99);
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });
  });

  describe('selectors', () => {
    it('selectSubtotal should sum price * quantity', () => {
      useCartStore.setState({
        items: [
          { ...mockItem, productId: '1', price: 100000, quantity: 2 } as CartItem,
          { ...mockItem, productId: '2', price: 50000, quantity: 1 } as CartItem,
        ],
        voucherCode: null,
        voucherDiscount: 0,
      });
      expect(selectSubtotal(useCartStore.getState())).toBe(250000);
    });

    it('selectTotalItems should sum quantities', () => {
      useCartStore.setState({
        items: [
          { ...mockItem, productId: '1', quantity: 2 } as CartItem,
          { ...mockItem, productId: '2', quantity: 3 } as CartItem,
        ],
        voucherCode: null,
        voucherDiscount: 0,
      });
      expect(selectTotalItems(useCartStore.getState())).toBe(5);
    });

    it('selectTotal should subtract voucher discount', () => {
      useCartStore.setState({
        items: [{ ...mockItem, price: 200000, quantity: 1 } as CartItem],
        voucherCode: 'SAVE50K',
        voucherDiscount: 50000,
      });
      expect(selectTotal(useCartStore.getState())).toBe(150000);
    });

    it('selectTotal should not go below 0', () => {
      useCartStore.setState({
        items: [{ ...mockItem, price: 10000, quantity: 1 } as CartItem],
        voucherCode: 'BIG',
        voucherDiscount: 999999,
      });
      expect(selectTotal(useCartStore.getState())).toBe(0);
    });
  });

  describe('clearCart', () => {
    it('should reset items and voucher', () => {
      useCartStore.setState({
        items: [{ ...mockItem, quantity: 1 } as CartItem],
        voucherCode: 'CODE',
        voucherDiscount: 10000,
      });
      useCartStore.getState().clearCart();
      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.voucherCode).toBeNull();
      expect(state.voucherDiscount).toBe(0);
    });
  });
});
