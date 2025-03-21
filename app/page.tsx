'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Calendar, Clock, Navigation, Sparkles } from 'lucide-react';
import PlaceSearch from '@/components/PlaceSearch';
import ItineraryCard from '@/components/ItineraryCard';
import DaySelector from '@/components/DaySelector';
import TransportSelector from '@/components/TransportSelector';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full animate-pulse bg-muted rounded-lg" />
  ),
});

export default function Home() {
  const [accommodation, setAccommodation] = useState<{
    address: string;
    coordinates: { lat: number; lng: number };
  } | null>(null);
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [transportModes, setTransportModes] = useState(['walking']);
  const [itineraries, setItineraries] = useState<Array<any>>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const generateItinerary = useCallback(async () => {
    if (!accommodation) return;
    setIsGenerating(true);

    try {
      // Call the local LLM server
      const response = await fetch('http://localhost:3002/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: accommodation,
          days: numberOfDays,
          transportModes: transportModes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate itinerary');
      }

      const data = await response.json();
      
      // Process the itineraries to ensure they have the right format
      const processedItineraries = data.itineraries.map((itinerary: any) => {
        // Ensure accommodation is first and last place
        const places = [
          {
            name: 'Your Accommodation',
            description: 'Starting point',
            duration: '0 min',
            address: accommodation.address,
            type: 'accommodation',
            coordinates: accommodation.coordinates,
          },
          ...itinerary.places,
          {
            name: 'Your Accommodation',
            description: 'Return point',
            duration: '0 min',
            address: accommodation.address,
            type: 'accommodation',
            coordinates: accommodation.coordinates,
          }
        ];
        
        return {
          ...itinerary,
          places
        };
      });

      setItineraries(processedItineraries);
    } catch (error) {
      console.error('Error generating itinerary:', error);
      // Fallback to mock data if LLM fails
      generateMockItinerary();
    } finally {
      setIsGenerating(false);
    }
  }, [accommodation, numberOfDays, transportModes]);

  // Keep the mock function as fallback
  const generateMockItinerary = () => {
    // Your existing mock itinerary generation code
    const mockItineraries = Array(numberOfDays)
      .fill(null)
      .map((_, dayIndex) => ({
        day: dayIndex + 1,
        totalDistance: '8.2 km',
        totalDuration: '7 hours',
        startTime: '9:00 AM',
        endTime: '4:00 PM',
        places: [
          {
            name: 'Your Accommodation',
            description: 'Starting point',
            duration: '0 min',
            address: accommodation?.address,
            type: 'accommodation',
            coordinates: accommodation?.coordinates,
          },
          {
            name: 'Local Cafe',
            description: 'Start your day with a traditional breakfast',
            duration: '45 min',
            address: '123 Sample Street',
            type: 'food',
            coordinates: {
              lat: accommodation?.coordinates?.lat || 0 + 0.01,
              lng: accommodation?.coordinates?.lng || 0 + 0.01,
            },
          },
          {
            name: 'Historic Museum',
            description: 'Explore local history and culture',
            duration: '2 hours',
            address: '456 History Lane',
            type: 'attraction',
            coordinates: {
              lat: accommodation?.coordinates?.lat || 0 + 0.02,
              lng: accommodation?.coordinates?.lng || 0 - 0.01,
            },
          },
          {
            name: 'City Park',
            description: 'Relax and enjoy nature in the heart of the city',
            duration: '1 hour',
            address: '789 Park Avenue',
            type: 'outdoor',
            coordinates: {
              lat: accommodation?.coordinates?.lat || 0 - 0.01,
              lng: accommodation?.coordinates?.lng || 0 + 0.02,
            },
          },
          {
            name: 'Local Restaurant',
            description: 'Lunch break with local specialties',
            duration: '1 hour',
            address: '321 Food Street',
            type: 'food',
            coordinates: {
              lat: accommodation?.coordinates?.lat || 0 - 0.02,
              lng: accommodation?.coordinates?.lng || 0 - 0.02,
            },
          },
          {
            name: 'Your Accommodation',
            description: 'Return point',
            duration: '0 min',
            address: accommodation?.address,
            type: 'accommodation',
            coordinates: accommodation?.coordinates,
          },
        ],
      }));

    setItineraries(mockItineraries);
  };

  const currentItinerary = itineraries[selectedDay - 1];
  const markers = currentItinerary?.places.map((place: any) => ({
    position: [place.coordinates?.lat, place.coordinates?.lng],
    popup: place.name,
    type: place.type,
  })) || [];

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            AI City Explorer
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Plan your perfect city exploration with AI. Enter your accommodation location and preferences to get started.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Plan Your Exploration
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Accommodation</label>
                  <PlaceSearch
                    onSelect={setAccommodation}
                    placeholder="Enter your accommodation address..."
                  />
                </div>

                <DaySelector value={numberOfDays} onChange={setNumberOfDays} />

                <TransportSelector
                  value={transportModes}
                  onChange={setTransportModes}
                />

                <Button
                  onClick={generateItinerary}
                  disabled={!accommodation || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Generating...
                    </span>
                  ) : (
                    'Generate Itinerary'
                  )}
                </Button>
              </div>
            </div>

            {itineraries.length > 0 && (
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Daily Routes</h2>
                  <div className="flex gap-2">
                    {Array.from({ length: numberOfDays }, (_, i) => (
                      <Button
                        key={i}
                        variant={selectedDay === i + 1 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedDay(i + 1)}
                      >
                        Day {i + 1}
                      </Button>
                    ))}
                  </div>
                </div>
                {currentItinerary && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        {currentItinerary.totalDistance}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {currentItinerary.totalDuration}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {currentItinerary.startTime} - {currentItinerary.endTime}
                      </div>
                    </div>
                    <div className="flex justify-end mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!accommodation) return;
                          router.push(`/community/create?location=${encodeURIComponent(accommodation.address)}&lat=${accommodation.coordinates.lat}&lng=${accommodation.coordinates.lng}`);
                        }}
                        disabled={!accommodation}
                      >
                        Share to Community
                      </Button>
                    </div>
                    <ItineraryCard places={currentItinerary.places} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-card overflow-hidden shadow-sm relative z-0">
            <MapComponent
              center={
                accommodation
                  ? [accommodation.coordinates.lat, accommodation.coordinates.lng]
                  : undefined
              }
              markers={markers}
            />
          </div>
        </div>
      </div>
    </main>
  );
}