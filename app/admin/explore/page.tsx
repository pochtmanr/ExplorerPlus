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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import PlaceForm from '@/components/PlaceForm';
import { Place } from '@/types';

type FormData = {
  city: string;
  image_url: string;
  description: string;
  history: string;
};

type PlacesState = {
  [key: string]: Place[];
  cultural: Place[];
  parks: Place[];
  streets: Place[];
  shopping: Place[];
  restaurants: Place[];
  entertainment: Place[];
};

export default function AdminExplorePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [explorePosts, setExplorePosts] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    city: '',
    image_url: '',
    description: '',
    history: ''
  });
  const router = useRouter();
  const [isPlaceFormOpen, setIsPlaceFormOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [places, setPlaces] = useState<PlacesState>({
    cultural: [],
    parks: [],
    streets: [],
    shopping: [],
    restaurants: [],
    entertainment: []
  });

  const categories = [
    { id: 'cultural', label: 'Cultural', icon: '🏛️' },
    { id: 'parks', label: 'Parks & Nature', icon: '🌳' },
    { id: 'streets', label: 'Streets & Districts', icon: '🏙️' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'restaurants', label: 'Food & Drinks', icon: '🍽️' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎭' },
  ];

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
      const { data: posts, error: postsError } = await supabase
        .from('explore_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // If we have a selected city, fetch its places
      if (editingId) {
        const { data: placesData, error: placesError } = await supabase
          .from('places')
          .select('*')
          .eq('city_id', editingId);

        if (placesError) throw placesError;

        const groupedPlaces = placesData.reduce((acc: any, place: Place) => {
          if (!acc[place.category]) {
            acc[place.category] = [];
          }
          acc[place.category].push(place);
          return acc;
        }, {
          cultural: [],
          parks: [],
          streets: [],
          shopping: [],
          restaurants: [],
          entertainment: []
        });

        setPlaces(groupedPlaces);
      }

      setExplorePosts(posts);
    } catch (error) {
      console.error('Error fetching explore posts:', error);
      toast.error('Error fetching explore posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create city post without places
      const { data: cityData, error: cityError } = await supabase
        .from('explore_posts')
        .insert([{
          city: formData.city,
          image_url: formData.image_url,
          description: formData.description,
          history: formData.history,
          rating: 0,
          routes_count: 0
        }])
        .select()
        .single();

      if (cityError) throw cityError;

      // Add places separately
      const placesToAdd = Object.values(places)
        .flat()
        .map(place => ({
          ...place,
          city_id: cityData.id,
          rating: 0,
          rating_count: 0
        }));

      if (placesToAdd.length > 0) {
        const { error: placesError } = await supabase
          .from('places')
          .insert(placesToAdd);

        if (placesError) throw placesError;
      }

      toast.success('City and places created successfully');
      setFormData({
        city: '',
        image_url: '',
        description: '',
        history: ''
      });
      setPlaces({
        cultural: [],
        parks: [],
        streets: [],
        shopping: [],
        restaurants: [],
        entertainment: []
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

  const handleAddPlace = async (place: Place) => {
    try {
      if (!editingId) {
        toast.error('Please select a city first');
        return;
      }

      const { data, error } = await supabase
        .from('places')
        .insert([{
          ...place,
          city_id: editingId,
          rating: 0,
          rating_count: 0
        }])
        .select()
        .single();

      if (error) throw error;

      // Refresh the places for the current city
      fetchExplorePosts();
      setIsPlaceFormOpen(false);
      toast.success('Place added successfully');
    } catch (error) {
      console.error('Error adding place:', error);
      toast.error('Error adding place');
    }
  };

  const handleEditPlace = async (placeId: string, updatedPlace: Place) => {
    try {
      const { error } = await supabase
        .from('places')
        .update(updatedPlace)
        .eq('id', placeId);

      if (error) throw error;
      toast.success('Place updated successfully');
      fetchExplorePosts();
    } catch (error) {
      console.error('Error updating place:', error);
      toast.error('Error updating place');
    }
  };

  const handleDeletePlace = async (placeId: string) => {
    try {
      const { error } = await supabase
        .from('places')
        .delete()
        .eq('id', placeId);

      if (error) throw error;
      toast.success('Place deleted successfully');
      fetchExplorePosts();
    } catch (error) {
      console.error('Error deleting place:', error);
      toast.error('Error deleting place');
    }
  };

  const handleEdit = async (post: any) => {
    try {
      setFormData({
        city: post.city,
        image_url: post.image_url,
        description: post.description,
        history: post.history
      });
      setEditingId(post.id);
      setIsCreating(true);
      setIsEditing(true);
    } catch (error) {
      console.error('Error loading city:', error);
      toast.error('Error loading city');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('explore_posts')
        .update({
          city: formData.city,
          image_url: formData.image_url,
          description: formData.description,
          history: formData.history
        })
        .eq('id', editingId);

      if (error) throw error;

      toast.success('City updated successfully');
      setFormData({
        city: '',
        image_url: '',
        description: '',
        history: ''
      });
      setIsCreating(false);
      setIsEditing(false);
      setEditingId(null);
      fetchExplorePosts();
    } catch (error) {
      console.error('Error updating explore post:', error);
      toast.error('Error updating explore post');
    }
  };

  const handleCityImageUpload = (urls: string[]) => {
    setFormData(prev => ({ 
      ...prev, 
      image_url: urls[0] 
    }));
  };

  const handlePlaceImageUpload = (
    category: keyof FormData['places'],
    index: number,
    urls: string[]
  ) => {
    console.log('Place image upload:', { category, index, urls });
    setFormData(prev => ({
      ...prev,
      places: {
        ...prev.places,
        [category]: prev.places[category as keyof FormData['places']].map((place, i) => 
          i === index ? { ...place, image_url: urls[0] } : place
        )
      }
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
    <main className="container mx-auto py-8">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New City
          </Button>
        </div>

        <Tabs defaultValue="cities" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cities">Cities</TabsTrigger>
            <TabsTrigger value="places">Places</TabsTrigger>
          </TabsList>

          <TabsContent value="cities" className="space-y-6">
            {/* City Creation/Edit Form */}
            {isCreating && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {isEditing ? 'Edit City Guide' : 'Create New City Guide'}
                </h2>
                <form onSubmit={isEditing ? handleUpdate : handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                  <div>
                      <Label>City Name</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Main City Image</Label>
                      <ImageUpload
                        value={formData.image_url ? [formData.image_url] : []}
                        onChange={handleCityImageUpload}
                        bucket="avatars"
                        folder="explore/cities"
                      />
                    </div>

                    <div>
                      <Label>Short Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label>History & Overview</Label>
                      <Textarea
                        value={formData.history}
                        onChange={(e) => setFormData(prev => ({ ...prev, history: e.target.value }))}
                        className="min-h-[200px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Places of Interest</h2>
                    <Tabs defaultValue="cultural">
                      <TabsList>
                        {categories.map(category => (
                          <TabsTrigger key={category.id} value={category.id}>
                            <span className="mr-2">{category.icon}</span>
                            {category.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {categories.map(category => (
                        <TabsContent key={category.id} value={category.id}>
                          <div className="space-y-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingPlace({
                                  name: '',
                                  category: category.id,
                                  short_description: '',
                                  full_description: '',
                                  image_url: '',
                                  location: { lat: 0, lng: 0 },
                                  address: '',
                                  opening_hours: '',
                                  website: ''
                                });
                                setIsPlaceFormOpen(true);
                              }}
                            >
                              Add {category.label} Place
                            </Button>

                            {places[category.id as keyof FormData['places']]?.map((place: Place, index: number) => (
                              <Card key={`${category}-${index}`} className="overflow-hidden">
                                {place.image_url && (
                                  <div className="relative aspect-video">
                                    <img
                                      src={place.image_url}
                                      alt={place.name}
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                )}
                                <div className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h3 className="font-semibold">{place.name}</h3>
                                      <p className="text-sm text-muted-foreground">
                                        {categories.find(c => c.id === category.id)?.label}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setEditingPlace({ ...place, index, category: category.id });
                                          setIsPlaceFormOpen(true);
                                        }}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeletePlace(place.id || '')}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-sm line-clamp-2">{place.short_description}</p>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" onClick={isEditing ? handleUpdate : handleSubmit}>
                      {isEditing ? 'Update' : 'Create'} City Guide
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                        setEditingId(null);
                        setFormData({
                          city: '',
                          image_url: '',
                          description: '',
                          history: ''
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Cities Grid */}
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
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(post)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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
          </TabsContent>

          <TabsContent value="places" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Places</h2>
                <p className="text-sm text-muted-foreground">
                  Add and manage places for your cities
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <select 
                  className="p-2 border rounded-md"
                  onChange={(e) => {
                    setEditingId(e.target.value);
                    // Reset places when changing city
                    setPlaces({
                      cultural: [],
                      parks: [],
                      streets: [],
                      shopping: [],
                      restaurants: [],
                      entertainment: []
                    });
                    if (e.target.value) {
                      fetchExplorePosts();
                    }
                  }}
                  value={editingId || ''}
                >
                  <option value="">Select a City</option>
                  {explorePosts.map(post => (
                    <option key={post.id} value={post.id}>
                      {post.city}
                    </option>
                  ))}
                </select>
                <Button 
                  onClick={() => {
                    setEditingPlace(null);
                    setIsPlaceFormOpen(true);
                  }}
                  disabled={!editingId}
                >
                  Add New Place
                </Button>
              </div>
            </div>

            {/* Places Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {editingId && Object.entries(places).map(([category, categoryPlaces]) =>
                categoryPlaces.map((place: Place, index: number) => (
                  <Card key={place.id || `${category}-${index}`} className="overflow-hidden">
                    {place.image_url && (
                      <div className="relative aspect-video">
                        <img
                          src={place.image_url}
                          alt={place.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{place.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {categories.find(c => c.id === category)?.label}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPlace({ ...place, category });
                              setIsPlaceFormOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePlace(place.id || '')}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm line-clamp-2">{place.short_description}</p>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <PlaceForm
              open={isPlaceFormOpen}
              onClose={() => {
                setIsPlaceFormOpen(false);
                setEditingPlace(null);
              }}
              onSubmit={(place) => {
                if (editingPlace?.id) {
                  handleEditPlace(editingPlace.id, place);
                } else {
                  handleAddPlace(place);
                }
              }}
              initialData={editingPlace || undefined}
              editMode={!!editingPlace?.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
} 