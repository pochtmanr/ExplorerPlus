export type Place = {
  id?: string;
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
  index?: number;
}; 