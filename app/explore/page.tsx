'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';

export default function ExplorePage() {
  return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Explore Popular Destinations
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Discover curated routes and local recommendations for the world&apos;s most exciting cities.
        </p>
      </div>

      <div className="relative mb-12">
        <Search className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search cities, routes, or places..."
          className="w-full pl-12 pr-4 py-2 rounded-full border bg-background"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            city: 'New York',
            image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
            routes: 125,
            rating: 4.8,
          },
          {
            city: 'Paris',
            image: 'https://images.unsplash.com/photo-1493707553966-283afac8c358',
            routes: 98,
            rating: 4.9,
          },
          {
            city: 'Tokyo',
            image: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be',
            routes: 156,
            rating: 4.7,
          },
        ].map((city, index) => (
          <Card key={index} className="overflow-hidden group">
            <div className="relative aspect-[4/3]">
              <img
                src={city.image}
                alt={city.city}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-semibold">{city.city}</h3>
                <p className="text-sm opacity-90">
                  {city.routes} routes • {city.rating} rating
                </p>
              </div>
            </div>
            <div className="p-4">
              <Button className="w-full">Explore Routes</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
    </main>
  );
}