'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { usePlacesAutocomplete } from '../../../hooks/usePlacesAutocomplete';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const router = useRouter();
  const { suggestions, searchLocation } = usePlacesAutocomplete();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const uploadedUrls = [];
    for (const file of images) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('posts')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(publicUrl);
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const imageUrls = await uploadImages();

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          location,
          image_urls: imageUrls,
        });

      if (error) throw error;

      toast.success('Post created successfully');
      router.push('/community');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  searchLocation(e.target.value);
                }}
                required
              />
              {suggestions.length > 0 && (
                <ul className="mt-2 border rounded-md divide-y">
                  {suggestions.map((suggestion: string, index: number) => (
                    <li
                      key={index}
                      className="p-2 hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setLocation(suggestion);
                        searchLocation('');
                      }}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={images.length >= 3}
              />
              <div className="grid grid-cols-3 gap-2">
                {images.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Post'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
} 