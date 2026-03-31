'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Camera, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  variant?: 'cover' | 'avatar';
}

export function ImageUpload({ value, onChange, className, variant = 'cover' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.upload<{ url: string }>('/api/upload', file);
      if (res.success && res.data) {
        onChange(res.data.url);
      } else {
        toast.error(res.error || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (variant === 'avatar') {
    return (
      <div className={cn('relative inline-block', className)}>
        <div
          className="relative h-20 w-20 rounded-full overflow-hidden bg-muted cursor-pointer border-2 border-border hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {value ? (
            <img src={value} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Camera className="h-6 w-6" />
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            </div>
          )}
        </div>
        {value && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  // Cover variant
  return (
    <div className={cn('relative', className)}>
      <div
        className="relative h-40 w-full rounded-lg overflow-hidden bg-muted cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <img src={value} alt="Cover" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Camera className="h-8 w-8" />
            <span className="text-sm">Click to upload cover image</span>
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>
      {value && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 rounded-full"
          onClick={(e) => { e.stopPropagation(); onChange(null); }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
