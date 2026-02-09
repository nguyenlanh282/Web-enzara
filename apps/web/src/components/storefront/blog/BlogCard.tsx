import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock } from 'lucide-react';

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

interface BlogCardProps {
  post: Post;
}

export function BlogCard({ post }: BlogCardProps) {
  const publishedDate = new Date(post.publishedAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {post.featuredImage && (
        <div className="relative w-full aspect-video overflow-hidden bg-neutral-100">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-5">
        <span className="inline-block px-2 py-1 bg-primary-700 text-white text-xs font-medium rounded mb-3">
          {post.category.name}
        </span>

        <h3 className="text-lg font-heading font-semibold text-neutral-900 line-clamp-2 mb-2 group-hover:text-primary-700 transition-colors">
          {post.title}
        </h3>

        <p className="text-sm text-neutral-600 line-clamp-2 mb-4">{post.excerpt}</p>

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{publishedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{post.readingTime} phút</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
