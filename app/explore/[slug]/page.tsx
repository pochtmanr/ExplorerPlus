'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Clock,
  Globe,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type Place = {
  name: string;
  category: string;
  short_description: string;
  full_description: string;
  image_url: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  opening_hours?: string;
  website?: string;
};

export default function CityDetailsPage({ params }: { params: { slug: string } }) {
  const [city, setCity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [expandedHistory, setExpandedHistory] = useState(false);

  useEffect(() => {
    fetchCityDetails();
  }, []);

  const fetchCityDetails = async () => {
    try {
      const { data: cityData, error: cityError } = await supabase
        .from('explore_posts')
        .select('*')
        .eq('slug', params.slug)
        .single();

      if (cityError) throw cityError;

      const { data: placesData, error: placesError } = await supabase
        .from('places')
        .select('*')
        .eq('city_id', cityData.id);

      if (placesError) throw placesError;

      // Group places by category
      const groupedPlaces = placesData.reduce((acc, place) => {
        if (!acc[place.category]) {
          acc[place.category] = [];
        }
        acc[place.category].push(place);
        return acc;
      }, {});

      setCity({
        ...cityData,
        places: groupedPlaces
      });
    } catch (error) {
      console.error('Error fetching city details:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'cultural', label: 'Cultural', icon: '🏛️' },
    { id: 'parks', label: 'Parks & Nature', icon: '🌳' },
    { id: 'streets', label: 'Streets & Districts', icon: '🏙️' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'restaurants', label: 'Food & Drinks', icon: '🍽️' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎭' },
  ];

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
      {/* Hero Section */}
      <div className="relative h-[60vh] bg-black">
        <img
          src={city.image_url}
          alt={city.city}
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{city.city}</h1>
          <p className="text-gray-900 max-w-2xl mb-8">
            {city.description}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* History Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">History & Overview</h2>
          <Card className="p-6">
            <p className={`text-muted-foreground ${!expandedHistory && 'line-clamp-3'}`}>
              {city.history}
            </p>
            <Button
              variant="ghost"
              onClick={() => setExpandedHistory(!expandedHistory)}
              className="mt-2"
            >
              {expandedHistory ? (
                <>
                  Show Less <ChevronUp className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Read More <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </Card>
        </section>

        {/* Places by Category */}
        <Tabs defaultValue="cultural" className="space-y-8">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {city.places[category.id]?.map((place: Place) => (
                  <Card 
                    key={place.name} 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedPlace(place)}
                  >
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
                      <h3 className="text-lg font-semibold mb-2">{place.name}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {place.short_description}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{place.address}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Place Details Dialog */}
        <Dialog open={!!selectedPlace} onOpenChange={() => setSelectedPlace(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedPlace?.name}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[80vh]">
              {selectedPlace && (
                <div className="space-y-6">
                  {selectedPlace.image_url && (
                    <div className="relative aspect-video">
                      <img
                        src={selectedPlace.image_url}
                        alt={selectedPlace.name}
                        className="object-cover w-full h-full rounded-lg"
                      />
                    </div>
                  )}
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      {selectedPlace.full_description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedPlace.address}</span>
                      </div>
                      {selectedPlace.opening_hours && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>{selectedPlace.opening_hours}</span>
                        </div>
                      )}
                      {selectedPlace.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4" />
                          <a
                            href={selectedPlace.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            Visit Website
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
} 