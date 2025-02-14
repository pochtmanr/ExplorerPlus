'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ImageUpload } from '@/components/ImageUpload';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminExplorePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [explorePosts, setExplorePosts] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    city: '',
    image_url: '',
    photo_gallery: [] as string[],
    routes_count: 0,
    rating: 0,
    description: '',
    places: [] as { name: string; description: string; image_url?: string }[],
    routes: [] as { name: string; difficulty: string; length: number; description: string }[]
  });
  const router = useRouter();

  useEffect(() => {
    checkAdminStatus();
    fetchExplorePosts();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/');
    }
  };

  const fetchExplorePosts = async () => {
    try {
      const { data, error } = await supabase
        .from('explore_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExplorePosts(data || []);
    } catch (error) {
      console.error('Error fetching explore posts:', error);
      toast.error('Error fetching explore posts');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('explore_posts')
        .insert([formData]);

      if (error) throw error;

      toast.success('Explore post created successfully');
      setFormData({
        city: '',
        image_url: '',
        photo_gallery: [],
        routes_count: 0,
        rating: 0,
        description: '',
        places: [],
        routes: []
      });
      setIsCreating(false);
      fetchExplorePosts();
    } catch (error) {
      console.error('Error creating explore post:', error);
      toast.error('Error creating explore post');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('explore_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Explore post deleted successfully');
      fetchExplorePosts();
    } catch (error) {
      console.error('Error deleting explore post:', error);
      toast.error('Error deleting explore post');
    }
  };

  const handleAddPlace = () => {
    setFormData(prev => ({
      ...prev,
      places: [...prev.places, { name: '', description: '', image_url: '' }]
    }));
  };

  const handleAddRoute = () => {
    setFormData(prev => ({
      ...prev,
      routes: [...prev.routes, { name: '', difficulty: 'moderate', length: 0, description: '' }]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Explore Posts</h1>
          <Button onClick={() => setIsCreating(!isCreating)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Destination
          </Button>
        </div>

        {isCreating && (
          <Card className="p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="city">City Name</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="routes_count">Routes Count</Label>
                  <Input
                    id="routes_count"
                    type="number"
                    value={formData.routes_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, routes_count: parseInt(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label>Photo Gallery</Label>
                <ImageUpload
                  value={formData.photo_gallery}
                  onChange={(urls: string[]) => setFormData(prev => ({ ...prev, photo_gallery: urls }))}
                  multiple
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Places of Interest</Label>
                  <Button type="button" variant="outline" onClick={handleAddPlace}>
                    Add Place
                  </Button>
                </div>
                {formData.places.map((place, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg mb-4">
                    <Input
                      placeholder="Place name"
                      value={place.name}
                      onChange={(e) => {
                        const newPlaces = [...formData.places];
                        newPlaces[index].name = e.target.value;
                        setFormData(prev => ({ ...prev, places: newPlaces }));
                      }}
                    />
                    <Textarea
                      placeholder="Description"
                      value={place.description}
                      onChange={(e) => {
                        const newPlaces = [...formData.places];
                        newPlaces[index].description = e.target.value;
                        setFormData(prev => ({ ...prev, places: newPlaces }));
                      }}
                    />
                    <ImageUpload
                      value={place.image_url ? [place.image_url] : []}
                      onChange={(urls: string[]) => {
                        const newPlaces = [...formData.places];
                        newPlaces[index].image_url = urls[0];
                        setFormData(prev => ({ ...prev, places: newPlaces }));
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        const newPlaces = formData.places.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, places: newPlaces }));
                      }}
                    >
                      Remove Place
                    </Button>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Routes</Label>
                  <Button type="button" variant="outline" onClick={handleAddRoute}>
                    Add Route
                  </Button>
                </div>
                {formData.routes.map((route, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg mb-4">
                    <Input
                      placeholder="Route name"
                      value={route.name}
                      onChange={(e) => {
                        const newRoutes = [...formData.routes];
                        newRoutes[index].name = e.target.value;
                        setFormData(prev => ({ ...prev, routes: newRoutes }));
                      }}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Difficulty</Label>
                        <select
                          value={route.difficulty}
                          onChange={(e) => {
                            const newRoutes = [...formData.routes];
                            newRoutes[index].difficulty = e.target.value;
                            setFormData(prev => ({ ...prev, routes: newRoutes }));
                          }}
                          className="w-full border rounded-md p-2"
                        >
                          <option value="easy">Easy</option>
                          <option value="moderate">Moderate</option>
                          <option value="difficult">Difficult</option>
                        </select>
                      </div>
                      <div>
                        <Label>Length (km)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={route.length}
                          onChange={(e) => {
                            const newRoutes = [...formData.routes];
                            newRoutes[index].length = parseFloat(e.target.value);
                            setFormData(prev => ({ ...prev, routes: newRoutes }));
                          }}
                        />
                      </div>
                    </div>
                    <Textarea
                      placeholder="Route description"
                      value={route.description}
                      onChange={(e) => {
                        const newRoutes = [...formData.routes];
                        newRoutes[index].description = e.target.value;
                        setFormData(prev => ({ ...prev, routes: newRoutes }));
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        const newRoutes = formData.routes.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, routes: newRoutes }));
                      }}
                    >
                      Remove Route
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Post</Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {explorePosts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <div className="relative aspect-[4/3]">
                <img
                  src={post.image_url}
                  alt={post.city}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-semibold">{post.city}</h3>
                  <p className="text-sm opacity-90">
                    {post.routes_count} routes • {post.rating} rating
                  </p>
                </div>
              </div>
              <div className="p-4 flex gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
} 