'use client';

import { Clock, MapPin, ExternalLink, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateGoogleMapsUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Place {
  name: string;
  description: string;
  duration: string;
  address: string;
  type: 'accommodation' | 'food' | 'attraction' | 'outdoor';
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface ItineraryCardProps {
  places: Place[];
}

export default function ItineraryCard({ places }: ItineraryCardProps) {
  const router = useRouter();

  if (!places?.length) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Your personalized itinerary will appear here after you select your preferences.
        </p>
      </div>
    );
  }

  const handleOpenInGoogleMaps = () => {
    const url = generateGoogleMapsUrl(places);
    window.open(url, '_blank');
  };

  const handleShare = (place: Place) => {
    router.push(`/community/create?location=${encodeURIComponent(place.address)}&lat=${place.coordinates.lat}&lng=${place.coordinates.lng}&name=${encodeURIComponent(place.name)}&description=${encodeURIComponent(place.description)}`);
  };

  return (
    <div className="space-y-6">
      <Button
        onClick={handleOpenInGoogleMaps}
        variant="outline"
        className="w-full flex items-center gap-2"
      >
        <ExternalLink className="w-4 h-4" />
        Open in Google Maps
      </Button>
      
      {places.map((place, index) => (
        <div
          key={index}
          className="relative pl-6 border-l-2 border-primary/20 last:border-l-0"
        >
          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
            {index + 1}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">{place.name}</h3>
              {place.type !== 'accommodation' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleShare(place)}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{place.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {place.duration !== '0 min' && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {place.duration}
                </div>
              )}
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {place.address}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}