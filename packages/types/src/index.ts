// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Product types
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice: number | null;
  primaryImage: string | null;
  avgRating: number;
  soldCount: number;
  stockQuantity: number;
  isFeatured: boolean;
}

// Cart types
export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  image: string | null;
  maxQuantity: number;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}
