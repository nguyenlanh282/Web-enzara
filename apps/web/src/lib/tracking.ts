// Type declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    ttq?: { track: (...args: any[]) => void };
    dataLayer?: any[];
  }
}

export class TrackingService {
  // GA4 Events
  static viewItem(product: {
    sku?: string;
    name: string;
    category?: string;
    brand?: string;
    price: number;
  }) {
    window.gtag?.("event", "view_item", {
      currency: "VND",
      value: product.price,
      items: [
        {
          item_id: product.sku || "",
          item_name: product.name,
          item_category: product.category,
          item_brand: product.brand,
          price: product.price,
          quantity: 1,
        },
      ],
    });
    // FB Pixel
    window.fbq?.("track", "ViewContent", {
      content_ids: [product.sku || ""],
      content_type: "product",
      content_name: product.name,
      value: product.price,
      currency: "VND",
    });
    // TikTok
    window.ttq?.track("ViewContent", {
      content_id: product.sku || "",
      content_name: product.name,
      content_type: "product",
      value: product.price,
      currency: "VND",
    });
  }

  static addToCart(product: {
    sku?: string;
    name: string;
    variant?: string;
    price: number;
    quantity: number;
  }) {
    window.gtag?.("event", "add_to_cart", {
      currency: "VND",
      value: product.price * product.quantity,
      items: [
        {
          item_id: product.sku || "",
          item_name: product.name,
          item_variant: product.variant,
          price: product.price,
          quantity: product.quantity,
        },
      ],
    });
    // FB Pixel
    window.fbq?.("track", "AddToCart", {
      content_ids: [product.sku || ""],
      content_type: "product",
      content_name: product.name,
      value: product.price * product.quantity,
      currency: "VND",
    });
    // TikTok
    window.ttq?.track("AddToCart", {
      content_id: product.sku || "",
      content_name: product.name,
      content_type: "product",
      value: product.price * product.quantity,
      currency: "VND",
      quantity: product.quantity,
    });
  }

  static beginCheckout(
    value: number,
    items: Array<{ sku?: string; name: string; price: number; quantity: number }>
  ) {
    window.gtag?.("event", "begin_checkout", {
      currency: "VND",
      value: value,
      items: items.map((item) => ({
        item_id: item.sku || "",
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
    // FB Pixel
    window.fbq?.("track", "InitiateCheckout", {
      content_ids: items.map((item) => item.sku || ""),
      content_type: "product",
      value: value,
      currency: "VND",
      num_items: items.reduce((sum, item) => sum + item.quantity, 0),
    });
    // TikTok
    window.ttq?.track("InitiateCheckout", {
      content_type: "product",
      value: value,
      currency: "VND",
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }

  static purchase(order: {
    orderNumber: string;
    total: number;
    shippingFee: number;
    items: Array<{
      sku?: string;
      productName: string;
      price: number;
      quantity: number;
    }>;
  }) {
    window.gtag?.("event", "purchase", {
      transaction_id: order.orderNumber,
      value: order.total,
      currency: "VND",
      shipping: order.shippingFee,
      items: order.items.map((item) => ({
        item_id: item.sku || "",
        item_name: item.productName,
        price: item.price,
        quantity: item.quantity,
      })),
    });
    // FB Pixel
    window.fbq?.("track", "Purchase", {
      content_ids: order.items.map((item) => item.sku || ""),
      content_type: "product",
      value: order.total,
      currency: "VND",
      num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
    });
    // TikTok
    window.ttq?.track("CompletePayment", {
      content_type: "product",
      value: order.total,
      currency: "VND",
      quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }

  static search(query: string) {
    window.gtag?.("event", "search", {
      search_term: query,
    });
    // FB Pixel
    window.fbq?.("track", "Search", {
      search_string: query,
    });
    // TikTok
    window.ttq?.track("Search", {
      query: query,
    });
  }

  static viewCategory(category: string) {
    window.gtag?.("event", "view_item_list", {
      item_list_name: category,
    });
  }
}
