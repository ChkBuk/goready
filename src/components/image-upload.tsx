'use client';

import { useRef, useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { api } from '@/lib/api';
import { Camera, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  variant?: 'cover' | 'avatar';
}

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/jpeg', 0.9);
  });
}

export function ImageUpload({ value, onChange, className, variant = 'cover' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAvatar = variant === 'avatar';
  const cropAspect = isAvatar ? 1 : 16 / 9;
  const cropShape = isAvatar ? 'round' as const : 'rect' as const;

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleCropConfirm = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedBlob(imageToCrop, croppedAreaPixels);
      const file = new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' });
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
      setImageToCrop(null);
    }
  };

  const handleCropCancel = () => {
    setImageToCrop(null);
  };

  // Crop modal overlay
  if (imageToCrop) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
          <div className="relative h-80 bg-black">
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={cropAspect}
              cropShape={cropShape}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Zoom slider */}
          <div className="px-6 py-3">
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="flex gap-3 px-6 pb-5">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-full"
              onClick={handleCropCancel}
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-1.5" />
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 rounded-full"
              onClick={handleCropConfirm}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Check className="h-4 w-4 mr-1.5" />
              )}
              {isUploading ? 'Uploading...' : 'Crop & Upload'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isAvatar) {
    return (
      <div className={cn('relative inline-block', className)}>
        <div
          className="relative h-24 w-24 rounded-full overflow-hidden bg-muted cursor-pointer border-2 border-border hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {value ? (
            <img src={value} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Camera className="h-6 w-6" />
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
        className="relative h-48 w-full rounded-3xl overflow-hidden bg-muted/50 cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
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
