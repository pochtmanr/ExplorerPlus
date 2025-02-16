'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Upload, MapPin } from 'lucide-react';
import PlaceSearch from '@/components/PlaceSearch';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [location, setLocation] = useState<{
    address: string;
    coordinates: { lat: number; lng: number };
  } | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }
    
    // Validate each file
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Each image must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
    }
    
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const uploadedUrls = [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    for (const file of images) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Store only the file path, not the full URL
      uploadedUrls.push(fileName);
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      toast.error('Please select a location');
      return;
    }
    
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload images first
      const imageUrls = images.length > 0 ? await uploadImages() : [];

      // Create the post
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content,
          location: location.address,
          lat: location.coordinates.lat,  // Store latitude
          lng: location.coordinates.lng,  // Store longitude
          image_urls: imageUrls,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Post creation error:', error);
        throw error;
      }

      toast.success('Post created successfully');
      router.push('/community');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Error creating post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Share Your Experience</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Textarea
                placeholder="Share your experience about this place..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="min-h-[120px]"
              />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Location</span>
                </div>
                <PlaceSearch
                  onSelect={setLocation}
                  placeholder="Search for a place..."
                />
                {location && (
                  <div className="text-sm bg-muted/50 p-2 rounded-md">
                    {location.address}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="w-4 h-4" />
                  <span>Add Photos (up to 3)</span>
                </div>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  multiple
                  disabled={images.length >= 3}
                />
                
                <div className="grid grid-cols-3 gap-3">
                  {images.map((file, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <label
                      htmlFor="image-upload"
                      className="border-2 border-dashed border-muted-foreground/25 rounded-md flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors aspect-square"
                    >
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading || !location}>
              {loading ? 'Creating...' : 'Share Post'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
} 