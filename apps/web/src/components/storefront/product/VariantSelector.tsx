"use client";

import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  stockQuantity: number;
  attributes: Record<string, string>;
  isActive: boolean;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: VariantSelectorProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const selectedVariant = variants.find((v) => v.id === selectedId);

  const attributeGroups: Record<string, Set<string>> = {};
  variants.forEach((variant) => {
    Object.entries(variant.attributes).forEach(([key, value]) => {
      if (!attributeGroups[key]) {
        attributeGroups[key] = new Set();
      }
      attributeGroups[key].add(value);
    });
  });

  const getVariantByAttributes = (attributes: Record<string, string>) => {
    return variants.find((variant) =>
      Object.entries(attributes).every(
        ([key, value]) => variant.attributes[key] === value
      )
    );
  };

  const currentAttributes: Record<string, string> = selectedVariant?.attributes || {};

  const handleAttributeChange = (key: string, value: string) => {
    const newAttributes = { ...currentAttributes, [key]: value };
    const matchingVariant = getVariantByAttributes(newAttributes);
    if (matchingVariant) {
      onSelect(matchingVariant.id);
    }
  };

  if (variants.length === 0) {
    return null;
  }

  if (variants.length === 1) {
    const variant = variants[0];
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm text-neutral-600 mb-2">Tình trạng:</p>
          <p
            className={cn(
              "text-sm font-medium",
              variant.stockQuantity > 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {variant.stockQuantity > 0
              ? `Còn ${variant.stockQuantity} sản phẩm`
              : "Hết hàng"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(attributeGroups).map(([attributeKey, values]) => (
        <div key={attributeKey}>
          <p className="text-sm font-medium text-neutral-700 mb-3">
            {attributeKey}:
            {currentAttributes[attributeKey] && (
              <span className="ml-2 text-primary-700">
                {currentAttributes[attributeKey]}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from(values).map((value) => {
              const testAttributes = { ...currentAttributes, [attributeKey]: value };
              const testVariant = getVariantByAttributes(testAttributes);
              const isAvailable = testVariant && testVariant.isActive && testVariant.stockQuantity > 0;
              const isSelected = currentAttributes[attributeKey] === value;

              return (
                <button
                  key={value}
                  onClick={() => handleAttributeChange(attributeKey, value)}
                  disabled={!isAvailable}
                  className={cn(
                    "px-4 py-2 rounded-lg border-2 transition-all font-medium text-sm",
                    isSelected
                      ? "border-primary-700 bg-primary-50 text-primary-700"
                      : isAvailable
                        ? "border-neutral-300 hover:border-primary-700 text-neutral-700"
                        : "border-neutral-200 text-neutral-400 line-through cursor-not-allowed"
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedVariant && (
        <div className="pt-4 border-t">
          <div className="flex items-baseline gap-3 mb-3">
            {selectedVariant.salePrice ? (
              <>
                <span className="text-3xl font-bold text-primary-700">
                  {formatPrice(selectedVariant.salePrice)}
                </span>
                <span className="text-lg text-neutral-400 line-through">
                  {formatPrice(selectedVariant.price)}
                </span>
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                  -
                  {Math.round(
                    ((selectedVariant.price - selectedVariant.salePrice) /
                      selectedVariant.price) *
                      100
                  )}
                  %
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-primary-700">
                {formatPrice(selectedVariant.price)}
              </span>
            )}
          </div>

          <p
            className={cn(
              "text-sm font-medium",
              selectedVariant.stockQuantity > 0
                ? "text-green-600"
                : "text-red-600"
            )}
          >
            {selectedVariant.stockQuantity > 0
              ? `Còn ${selectedVariant.stockQuantity} sản phẩm`
              : "Hết hàng"}
          </p>
        </div>
      )}
    </div>
  );
}
