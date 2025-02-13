'use client';

import { useEffect, useRef, useState } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { Search } from 'lucide-react';

interface PlaceSearchProps {
  onLocationSelect: (location: {
    address: string;
    coordinates: { lat: number; lng: number };
  }) => void;
  placeholder?: string;
}

export default function PlaceSearch({ onLocationSelect, placeholder = "Enter destination..." }: PlaceSearchProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const scriptLoadAttempted = useRef(false);

  useEffect(() => {
    if (!scriptLoadAttempted.current && !window.google?.maps?.places) {
      scriptLoadAttempted.current = true;
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsScriptLoaded(true);
      };
      
      document.head.appendChild(script);
    } else if (window.google?.maps?.places) {
      setIsScriptLoaded(true);
    }
  }, []);

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
    initOnMount: isScriptLoaded,
  });

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onLocationSelect({ address, coordinates: { lat, lng } });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 rounded-md border bg-background"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
      />
      {status === 'OK' && (
        <ul className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              className="px-4 py-2 hover:bg-muted cursor-pointer"
              onClick={() => handleSelect(description)}
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}