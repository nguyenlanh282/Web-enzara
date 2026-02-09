'use client';

import { useState } from 'react';
import { Facebook, Twitter, Link as LinkIcon, Share2 } from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl =
    typeof window !== 'undefined'
      ? window.location.origin + url
      : 'https://enzara.vn' + url;

  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    zalo: `https://zalo.me/share?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <Share2 className="w-4 h-4" />
        <span className="font-medium">Chia sẻ:</span>
      </div>

      <button
        onClick={() => handleShare('facebook')}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        aria-label="Chia sẻ lên Facebook"
      >
        <Facebook className="w-4 h-4" />
        <span>Facebook</span>
      </button>

      <button
        onClick={() => handleShare('zalo')}
        className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
        aria-label="Chia sẻ lên Zalo"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2zm5.455 13.636c-.363.273-.818.409-1.273.409-.545 0-1.09-.182-1.545-.545l-2.636-2.091-2.636 2.091c-.909.727-2.182.727-3.091 0-.909-.727-1.091-2.091-.364-3l2.727-3.455c.727-.909 2.091-1.091 3-.364l2.636 2.091 2.636-2.091c.909-.727 2.182-.727 3.091 0 .909.727 1.091 2.091.364 3l-2.727 3.455c-.182.273-.545.5-.909.5z" />
        </svg>
        <span>Zalo</span>
      </button>

      <button
        onClick={() => handleShare('twitter')}
        className="flex items-center gap-2 px-3 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
        aria-label="Chia sẻ lên Twitter"
      >
        <Twitter className="w-4 h-4" />
        <span>Twitter</span>
      </button>

      <button
        onClick={handleCopyLink}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
          copied
            ? 'bg-green-600 text-white'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        }`}
        aria-label="Sao chép liên kết"
      >
        <LinkIcon className="w-4 h-4" />
        <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
      </button>
    </div>
  );
}
