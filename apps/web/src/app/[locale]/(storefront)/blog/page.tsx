import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { fetchAPI } from '@/lib/api-server';
import { Breadcrumbs } from '@/components/storefront/shared/Breadcrumbs';
import { Pagination } from '@/components/storefront/shared/Pagination';
import { BlogCard } from '@/components/storefront/blog/BlogCard';
import { generatePageMetadata } from '@/lib/seo';

export const revalidate = 300;

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  publishedAt: string;
  readingTime: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

interface PostsResponse {
  data: Post[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blog');
  return generatePageMetadata({
    title: t('seo.title'),
    description: t('seo.description'),
    path: '/blog',
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const t = await getTranslations('blog');
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const category = params.category || '';
  const search = params.search || '';

  const [postsResponse, categoriesData] = await Promise.all([
    fetchAPI<PostsResponse>(
      `/api/posts?page=${page}&limit=9&category=${category}&search=${search}`,
      300
    ),
    fetchAPI<Category[]>('/api/post-categories', 300),
  ]);

  const posts = postsResponse?.data || [];
  const meta = postsResponse?.meta || { total: 0, page: 1, limit: 9, totalPages: 0 };
  const categories = categoriesData || [];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: 'Blog' }]} />

        <div className="mt-8 mb-12 text-center">
          <h1 className="text-4xl lg:text-5xl font-heading font-bold text-neutral-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !category
                ? 'bg-primary-700 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {t('allCategories')}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/blog?category=${cat.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === cat.slug
                  ? 'bg-primary-700 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {cat.name} ({cat.postCount})
            </Link>
          ))}
        </div>

        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {meta.totalPages > 1 && (
              <Pagination
                current={meta.page}
                total={meta.totalPages}
                baseUrl="/blog"
                searchParams={params}
              />
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-neutral-500 text-lg">{t('noPosts')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
