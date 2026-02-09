import { fetchAPI } from "@/lib/api-server";
import { ProductCarousel } from "../home/ProductCarousel";

interface SuggestedProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice?: number;
  images: Array<{ url: string; altText?: string }>;
  avgRating?: number;
  soldCount?: number;
}

interface CrossSellSectionProps {
  productSlug: string;
}

export async function CrossSellSection({ productSlug }: CrossSellSectionProps) {
  const suggestions = await fetchAPI<SuggestedProduct[]>(
    `/products/${productSlug}/suggestions?limit=8`,
    120,
  );

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <ProductCarousel
        title="Khach hang cung mua"
        products={suggestions}
      />
    </div>
  );
}
