'use client';

import { useState, FormEvent } from 'react';
import { apiClient } from '@/lib/api';
import { Send, X } from 'lucide-react';

interface CommentFormProps {
  slug: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CommentForm({ slug, parentId, onSuccess, onCancel }: CommentFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }

    if (!email.trim()) {
      setError('Vui lòng nhập email của bạn');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email không hợp lệ');
      return;
    }

    if (!content.trim()) {
      setError('Vui lòng nhập nội dung bình luận');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post(`/api/posts/${slug}/comments`, {
        name: name.trim(),
        email: email.trim(),
        content: content.trim(),
        parentId: parentId || null,
      });

      setSuccess(true);
      setName('');
      setEmail('');
      setContent('');

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError('Không thể gửi bình luận. Vui lòng thử lại.');
      console.error('Failed to submit comment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Bình luận của bạn đang chờ duyệt. Cảm ơn bạn đã đóng góp ý kiến!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`name-${parentId || 'main'}`} className="block text-sm font-medium text-neutral-700 mb-1">
            Tên của bạn <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id={`name-${parentId || 'main'}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-700 focus:border-transparent"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label htmlFor={`email-${parentId || 'main'}`} className="block text-sm font-medium text-neutral-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id={`email-${parentId || 'main'}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-700 focus:border-transparent"
            disabled={loading}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor={`content-${parentId || 'main'}`} className="block text-sm font-medium text-neutral-700 mb-1">
          Nội dung <span className="text-red-500">*</span>
        </label>
        <textarea
          id={`content-${parentId || 'main'}`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-700 focus:border-transparent resize-none"
          disabled={loading}
          required
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white font-medium rounded-lg hover:bg-primary-800 transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          <span>{loading ? 'Đang gửi...' : 'Gửi bình luận'}</span>
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-200 text-neutral-700 font-medium rounded-lg hover:bg-neutral-300 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Hủy</span>
          </button>
        )}
      </div>
    </form>
  );
}
