'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BlogListItem } from './BlogListItem';
import { Search, FolderOpen, Clock } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  featuredImage: string | null;
  publishedAt: string;
}

interface BlogSidebarProps {
  categories: Category[];
  recentPosts: Post[];
}

export function BlogSidebar({ categories, recentPosts }: BlogSidebarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/blog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 p-5 bg-white">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết..."
              className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-700 focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-primary-700"
              aria-label="Tìm kiếm"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {categories.length > 0 && (
        <div className="rounded-xl border border-neutral-200 p-5 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="w-5 h-5 text-primary-700" />
            <h3 className="text-lg font-heading font-bold text-neutral-900">Danh mục</h3>
          </div>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/blog?category=${category.slug}`}
                  className="flex items-center justify-between py-2 text-neutral-700 hover:text-primary-700 transition-colors group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">{category.name}</span>
                  <span className="text-sm text-neutral-500">({category.postCount})</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recentPosts.length > 0 && (
        <div className="rounded-xl border border-neutral-200 p-5 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary-700" />
            <h3 className="text-lg font-heading font-bold text-neutral-900">Bài viết gần đây</h3>
          </div>
          <ul className="space-y-4">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <BlogListItem post={post} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
