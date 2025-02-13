import { useState, useEffect } from 'react';

export function usePlacesAutocomplete() {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const searchLocation = async (input: string) => {
    if (!input) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(input)}`
      );
      const data = await response.json();
      setSuggestions(data.predictions.map((p: any) => p.description));
    } catch (error) {
      console.error('Error fetching places:', error);
      setSuggestions([]);
    }
  };

  return { suggestions, searchLocation };
} 