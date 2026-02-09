"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductTabsProps {
  product: {
    description?: string;
    shortDesc?: string;
    weight?: number;
    sku?: string;
    barcode?: string;
  };
}

export function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">(
    "description"
  );

  const tabs = [
    { id: "description" as const, label: "Mô tả" },
    { id: "specs" as const, label: "Thông số" },
    { id: "reviews" as const, label: "Đánh giá" },
  ];

  return (
    <div className="mt-12">
      <div className="border-b">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-4 px-2 font-medium transition-colors relative",
                activeTab === tab.id
                  ? "text-primary-700"
                  : "text-neutral-600 hover:text-neutral-900"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-700" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="py-8">
        {activeTab === "description" && (
          <div className="prose max-w-none">
            {product.shortDesc && (
              <p className="text-lg text-neutral-700 mb-6">{product.shortDesc}</p>
            )}
            {product.description ? (
              <div
                dangerouslySetInnerHTML={{ __html: product.description }}
                className="text-neutral-600 leading-relaxed"
              />
            ) : (
              <p className="text-neutral-500 italic">
                Chưa có mô tả chi tiết cho sản phẩm này.
              </p>
            )}
          </div>
        )}

        {activeTab === "specs" && (
          <div className="max-w-2xl">
            <table className="w-full">
              <tbody className="divide-y">
                {product.sku && (
                  <tr>
                    <td className="py-3 pr-4 text-neutral-600 font-medium">SKU</td>
                    <td className="py-3 text-neutral-900">{product.sku}</td>
                  </tr>
                )}
                {product.barcode && (
                  <tr>
                    <td className="py-3 pr-4 text-neutral-600 font-medium">
                      Mã vạch
                    </td>
                    <td className="py-3 text-neutral-900">{product.barcode}</td>
                  </tr>
                )}
                {product.weight && (
                  <tr>
                    <td className="py-3 pr-4 text-neutral-600 font-medium">
                      Trọng lượng
                    </td>
                    <td className="py-3 text-neutral-900">{product.weight}g</td>
                  </tr>
                )}
              </tbody>
            </table>
            {!product.sku && !product.barcode && !product.weight && (
              <p className="text-neutral-500 italic">
                Chưa có thông số kỹ thuật cho sản phẩm này.
              </p>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="text-center py-12">
            <p className="text-neutral-500 text-lg">Chưa có đánh giá nào</p>
            <p className="text-neutral-400 text-sm mt-2">
              Hãy là người đầu tiên đánh giá sản phẩm này
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
