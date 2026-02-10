import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api-server';
import { Breadcrumbs } from '@/components/storefront/shared/Breadcrumbs';
import { breadcrumbJsonLd, generatePageMetadata } from '@/lib/seo';
import { TableOfContents } from '@/components/storefront/blog/TableOfContents';
import { ShareButtons } from '@/components/storefront/blog/ShareButtons';
import { CommentSection } from '@/components/storefront/blog/CommentSection';
import { BlogSidebar } from '@/components/storefront/blog/BlogSidebar';
import { BlogCard } from '@/components/storefront/blog/BlogCard';
import { Calendar, Clock, Eye } from 'lucide-react';

export const revalidate = 300;

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{ id: string; name: string; slug: string }>;
  publishedAt: string;
  readingTime: number;
  viewCount: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchAPI<Post>(`/api/posts/${slug}`, 300);

  if (!post) {
    return {
      title: 'Bài viết không tìm thấy',
    };
  }

  return generatePageMetadata({
    title: `${post.title} - Blog Enzara`,
    description: post.excerpt,
    image: post.featuredImage || undefined,
    path: `/blog/${slug}`,
    type: 'article',
    publishedTime: post.publishedAt,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchAPI<Post>(`/api/posts/${slug}`, 300);

  if (!post) {
    notFound();
  }

  const [relatedPostsData, categoriesData, recentPostsData] = await Promise.all([
    fetchAPI<{ data: Post[] }>(
      `/api/posts?category=${post.category.slug}&limit=3&exclude=${post.id}`,
      300
    ),
    fetchAPI<Category[]>('/api/post-categories', 300),
    fetchAPI<Post[]>('/api/posts/recent?limit=4', 300),
  ]);

  // Increment view count (non-blocking)
  fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/posts/${slug}/view`, {
    method: 'POST',
  }).catch(() => {});

  const relatedPosts = relatedPostsData?.data || [];
  const categories = categoriesData || [];
  const recentPosts = recentPostsData || [];

  const publishedDate = new Date(post.publishedAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage || '',
    datePublished: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'Enzara',
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: 'Trang chu', url: '/' },
            { name: 'Blog', url: '/blog' },
            { name: post.category.name, url: `/blog?category=${post.category.slug}` },
            { name: post.title, url: `/blog/${post.slug}` },
          ])),
        }}
      />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'Blog', href: '/blog' },
            { label: post.category.name, href: `/blog?category=${post.category.slug}` },
            { label: post.title },
          ]}
        />

        <article className="mt-8">
          {post.featuredImage && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-8">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="mb-6">
            <Link
              href={`/blog?category=${post.category.slug}`}
              className="inline-block px-3 py-1 bg-primary-700 text-white text-sm font-medium rounded-full mb-4 hover:bg-primary-800 transition-colors"
            >
              {post.category.name}
            </Link>

            <h1 className="text-3xl lg:text-4xl font-heading font-bold text-neutral-900 mb-4">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{publishedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{post.readingTime} phút đọc</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{post.viewCount} lượt xem</span>
              </div>
            </div>
          </div>

          <ShareButtons url={`/blog/${post.slug}`} title={post.title} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
              <TableOfContents content={post.content} />

              <div
                className="prose prose-neutral max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-primary-700 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl mt-8"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-neutral-200">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-neutral-200">
                <ShareButtons url={`/blog/${post.slug}`} title={post.title} />
              </div>

              <div className="mt-12">
                <CommentSection slug={post.slug} />
              </div>
            </div>

            <div className="lg:col-span-1">
              <BlogSidebar categories={categories} recentPosts={recentPosts} />
            </div>
          </div>
        </article>

        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-16 border-t border-neutral-200">
            <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-8">
              Bài viết liên quan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
