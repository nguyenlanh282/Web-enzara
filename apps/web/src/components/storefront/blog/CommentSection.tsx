'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import { MessageSquare } from 'lucide-react';

interface Comment {
  id: string;
  name: string;
  email: string;
  content: string;
  createdAt: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  slug: string;
}

export function CommentSection({ slug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const data = await apiClient.get<Comment[]>(`/api/posts/${slug}/comments`);
      setComments(data || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [slug]);

  const handleCommentSuccess = () => {
    fetchComments();
  };

  return (
    <div className="rounded-xl border border-neutral-200 p-6 bg-white">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary-700" />
        <h2 className="text-xl font-heading font-bold text-neutral-900">
          Bình luận ({comments.length})
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-8 text-neutral-500">Đang tải bình luận...</div>
      ) : (
        <>
          <CommentList comments={comments} slug={slug} onCommentSuccess={handleCommentSuccess} />

          <div className="mt-8 pt-8 border-t border-neutral-200">
            <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-4">
              Để lại bình luận
            </h3>
            <CommentForm slug={slug} onSuccess={handleCommentSuccess} />
          </div>
        </>
      )}
    </div>
  );
}
