import Link from 'next/link';
import Image from 'next/image';

interface Post {
  id: string;
  title: string;
  slug: string;
  featuredImage: string | null;
  publishedAt: string;
}

interface BlogListItemProps {
  post: Post;
}

export function BlogListItem({ post }: BlogListItemProps) {
  const publishedDate = new Date(post.publishedAt).toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link href={`/blog/${post.slug}`} className="flex gap-3 group">
      {post.featuredImage && (
        <div className="relative w-20 h-16 flex-shrink-0 rounded overflow-hidden bg-neutral-100">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-neutral-900 line-clamp-2 group-hover:text-primary-700 transition-colors mb-1">
          {post.title}
        </h4>
        <p className="text-xs text-neutral-500">{publishedDate}</p>
      </div>
    </Link>
  );
}
