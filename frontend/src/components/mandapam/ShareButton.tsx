import { useState } from 'react';

interface ShareButtonProps {
  mandapamName: string;
  area: string;
  className?: string;
}

export function ShareButton({
  mandapamName,
  area,
  className = 'btn btn-secondary',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareTitle = `${mandapamName} — Ganesh Mandapam Hyderabad`;
    const shareText = `Check out ${mandapamName} in ${area}, Hyderabad.`;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await copyToClipboard(shareUrl);
        }
      }
    } else {
      await copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={className}
      aria-label={`Share ${mandapamName}`}
    >
      {copied ? '✓ Link copied!' : '↗ Share'}
    </button>
  );
}
