'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, MapPin, Star, Users } from 'lucide-react';

export default function RoutesPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Popular Routes
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Discover the most loved routes created by our community of explorers.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "NYC Art & Culture Tour",
            description: "A curated journey through New York's finest museums and galleries",
            image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9",
            duration: "6 hours",
            distance: "4.2 km",
            rating: 4.8,
            reviews: 124,
            creator: "Sarah Johnson"
          },
          {
            title: "Paris Romance Walk",
            description: "Experience the most romantic spots in the City of Light",
            image: "https://images.unsplash.com/photo-1493707553966-283afac8c358",
            duration: "4 hours",
            distance: "3.5 km",
            rating: 4.9,
            reviews: 89,
            creator: "Jean Pierre"
          },
          {
            title: "Tokyo Tech & Tradition",
            description: "Blend of modern technology and traditional Japanese culture",
            image: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be",
            duration: "5 hours",
            distance: "5.1 km",
            rating: 4.7,
            reviews: 156,
            creator: "Yuki Tanaka"
          }
        ].map((route, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="relative aspect-video">
              <img
                src={route.image}
                alt={route.title}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{route.title}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {route.description}
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {route.duration}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {route.distance}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4" />
                  {route.rating} ({route.reviews})
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {route.creator}
                </div>
              </div>
              <Button className="w-full">View Route</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
    </main>
  );
}