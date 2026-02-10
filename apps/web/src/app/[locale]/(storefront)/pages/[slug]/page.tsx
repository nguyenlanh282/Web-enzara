import { fetchAPI } from "@/lib/api-server";
import { Breadcrumbs } from "@/components/storefront/shared/Breadcrumbs";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished: boolean;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchAPI<Page>(`/pages/${slug}`);
  if (!page) return { title: "Trang khong ton tai" };
  return {
    title: page.metaTitle || `${page.title} - Enzara`,
    description: page.metaDescription || "",
  };
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchAPI<Page>(`/pages/${slug}`);

  if (!page || !page.isPublished) {
    notFound();
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Breadcrumbs items={[{ label: page.title }]} />

      <article className="mt-6 bg-white rounded-xl border border-neutral-200 p-8 lg:p-12">
        <h1 className="text-3xl lg:text-4xl font-heading font-bold text-neutral-900 mb-6">{page.title}</h1>

        <div
          className="prose prose-neutral max-w-none
            prose-headings:font-heading prose-headings:font-bold
            prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
            prose-p:font-body prose-p:text-neutral-700 prose-p:leading-relaxed prose-p:mb-4
            prose-ul:font-body prose-ul:text-neutral-700 prose-ul:mb-4
            prose-ol:font-body prose-ol:text-neutral-700 prose-ol:mb-4
            prose-li:mb-2
            prose-a:text-primary-700 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-neutral-900 prose-strong:font-semibold
            prose-img:rounded-xl prose-img:shadow-md
            prose-blockquote:border-l-4 prose-blockquote:border-primary-700 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-neutral-600
            prose-code:text-primary-700 prose-code:bg-primary-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
            prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-pre:rounded-xl prose-pre:p-4"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </div>
  );
}

export const revalidate = 3600;
