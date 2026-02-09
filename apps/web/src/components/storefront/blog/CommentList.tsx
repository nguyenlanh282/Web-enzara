'use client';

import { useState } from 'react';
import { CommentForm } from './CommentForm';
import { Reply } from 'lucide-react';

interface Comment {
  id: string;
  name: string;
  email: string;
  content: string;
  createdAt: string;
  replies?: Comment[];
}

interface CommentListProps {
  comments: Comment[];
  slug: string;
  onCommentSuccess?: () => void;
}

interface CommentItemProps {
  comment: Comment;
  slug: string;
  onCommentSuccess?: () => void;
  isReply?: boolean;
}

function CommentItem({ comment, slug, onCommentSuccess, isReply = false }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const createdDate = new Date(comment.createdAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const avatarLetter = comment.name.charAt(0).toUpperCase();

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    if (onCommentSuccess) {
      onCommentSuccess();
    }
  };

  return (
    <div className={isReply ? 'ml-8 pl-4 border-l-2 border-neutral-200' : ''}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-700 text-white flex items-center justify-center font-medium">
          {avatarLetter}
        </div>

        <div className="flex-1">
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-neutral-900">{comment.name}</span>
              <span className="text-xs text-neutral-500">{createdDate}</span>
            </div>
            <p className="text-neutral-700 text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>

          {!isReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 mt-2 text-sm text-primary-700 hover:text-primary-800 font-medium"
            >
              <Reply className="w-4 h-4" />
              <span>Trả lời</span>
            </button>
          )}

          {showReplyForm && (
            <div className="mt-4">
              <CommentForm
                slug={slug}
                parentId={comment.id}
                onSuccess={handleReplySuccess}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              slug={slug}
              onCommentSuccess={onCommentSuccess}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentList({ comments, slug, onCommentSuccess }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          slug={slug}
          onCommentSuccess={onCommentSuccess}
        />
      ))}
    </div>
  );
}
