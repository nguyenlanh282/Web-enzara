"use client";

import { useState } from "react";
import { VariantSelector } from "@/components/storefront/product/VariantSelector";
import { TrackingService } from "@/lib/tracking";

interface Variant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  salePrice?: number;
  stockQuantity: number;
  attributes: Record<string, string>;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  basePrice: number;
  salePrice?: number;
  variants: Variant[];
}

interface AddToCartSectionProps {
  product: Product;
}

export default function AddToCartSection({ product }: AddToCartSectionProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = selectedVariantId
    ? product.variants.find((v) => v.id === selectedVariantId) ?? null
    : null;

  const currentPrice = selectedVariant
    ? selectedVariant.salePrice || selectedVariant.price
    : product.salePrice || product.basePrice;

  const stockQuantity = selectedVariant ? selectedVariant.stockQuantity : 0;

  const formatPrice = (p: number) => new Intl.NumberFormat("vi-VN").format(p) + "đ";

  const handleQuantityChange = (value: number) => {
    if (value < 1) setQuantity(1);
    else if (value > 99) setQuantity(99);
    else if (selectedVariant && value > selectedVariant.stockQuantity) setQuantity(selectedVariant.stockQuantity);
    else setQuantity(value);
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      alert("Vui long chon phien ban san pham");
      return;
    }

    if (selectedVariant.stockQuantity === 0) {
      alert("San pham nay hien dang het hang");
      return;
    }

    alert(`Da them ${quantity} x ${product.name} - ${selectedVariant.name} vao gio hang!\n\nGio hang se duoc trien khai trong Phase 04.`);

    TrackingService.addToCart({
      sku: selectedVariant?.sku,
      name: product.name,
      variant: selectedVariant?.name,
      price: currentPrice,
      quantity,
    });
  };

  return (
    <div className="space-y-6">
      <VariantSelector
        variants={product.variants}
        selectedId={selectedVariantId ?? undefined}
        onSelect={setSelectedVariantId}
      />

      {selectedVariant && (
        <>
          <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600 font-body">Gia:</span>
              <span className="text-lg font-heading font-bold text-primary-700">{formatPrice(currentPrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600 font-body">Ton kho:</span>
              <span
                className={`text-sm font-body font-semibold ${
                  stockQuantity > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stockQuantity > 0 ? `${stockQuantity} san pham` : "Het hang"}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-body text-neutral-700 mb-2">
              So luong:
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-lg border border-neutral-300 flex items-center justify-center text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                min={1}
                max={Math.min(99, stockQuantity)}
                className="w-20 h-10 px-3 border border-neutral-300 rounded-lg text-center font-body focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= stockQuantity || quantity >= 99}
                className="w-10 h-10 rounded-lg border border-neutral-300 flex items-center justify-center text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={stockQuantity === 0}
            className="w-full h-12 rounded-xl bg-primary-700 text-white font-body font-medium hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stockQuantity > 0 ? "Them vao gio hang" : "Het hang"}
          </button>
        </>
      )}
    </div>
  );
}
