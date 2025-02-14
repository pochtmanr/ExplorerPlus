'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Route, Compass } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function CityDetailsPage({ params }: { params: { slug: string } }) {
  const [city, setCity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCityDetails();
  }, []);

  const fetchCityDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('explore_posts')
        .select('*')
        .eq('slug', params.slug)
        .single();

      if (error) throw error;
      setCity(data);
    } catch (error) {
      console.error('Error fetching city details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!city) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">City not found</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="relative h-[50vh] bg-black">
        <img
          src={city.image_url}
          alt={city.city}
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute bottom-8 left-8 right-8">
          <h1 className="text-4xl font-bold text-white mb-2">{city.city}</h1>
          <p className="text-white/90 max-w-2xl">{city.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="gallery" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery">Photo Gallery</TabsTrigger>
            <TabsTrigger value="places">Places of Interest</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {city.photo_gallery?.map((photo: string, index: number) => (
                <img
                  key={index}
                  src={photo}
                  alt={`${city.city} ${index + 1}`}
                  className="aspect-square object-cover rounded-lg"
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="places" className="space-y-6">
            {city.places?.map((place: any, index: number) => (
              <Card key={index} className="p-6">
                <div className="flex gap-6">
                  {place.image_url && (
                    <img
                      src={place.image_url}
                      alt={place.name}
                      className="w-48 h-48 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{place.name}</h3>
                    <p className="text-muted-foreground">{place.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="routes" className="space-y-6">
            {city.routes?.map((route: any, index: number) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{route.name}</h3>
                    <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Route className="h-4 w-4" />
                        {route.length} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Compass className="h-4 w-4" />
                        {route.difficulty}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{route.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
} 