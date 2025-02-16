'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  bucket?: string;
  folder?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  multiple = false, 
  bucket = 'avatars',  // default to avatars bucket
  folder = ''  // optional subfolder
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder ? `${folder}/` : ''}${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        newUrls.push(publicUrl);

        if (!multiple) break;
      }

      onChange(multiple ? [...value, ...newUrls] : newUrls);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRemove = async (urlToRemove: string) => {
    try {
      // Extract file path from URL
      const path = urlToRemove.split(`${bucket}/`).pop();
      if (!path) return;

      await supabase.storage
        .from(bucket)
        .remove([path]);

      onChange(value.filter(url => url !== urlToRemove));
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {value.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Uploaded ${index + 1}`}
              className="h-24 w-24 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => onRemove(url)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div>
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          id="image-upload"
          onChange={onUpload}
          disabled={loading}
        />
        <label htmlFor="image-upload">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading}
            asChild
          >
            <span>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ImagePlus className="h-4 w-4 mr-2" />
              )}
              Upload Image{multiple ? 's' : ''}
            </span>
          </Button>
        </label>
      </div>
    </div>
  );
} 