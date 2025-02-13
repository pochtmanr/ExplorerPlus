import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateGoogleMapsUrl(places: Array<{ address: string; coordinates: { lat: number; lng: number } }>) {
  if (places.length < 2) return '';

  const origin = `${places[0].coordinates.lat},${places[0].coordinates.lng}`;
  const destination = `${places[places.length - 1].coordinates.lat},${places[places.length - 1].coordinates.lng}`;
  
  // Waypoints are all places except first and last
  const waypoints = places.slice(1, -1).map(place => 
    `${place.coordinates.lat},${place.coordinates.lng}`
  ).join('|');

  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  const params = new URLSearchParams({
    origin,
    destination,
    travelmode: 'walking',
  });

  if (waypoints) {
    params.append('waypoints', waypoints);
  }

  return `${baseUrl}&${params.toString()}`;
}