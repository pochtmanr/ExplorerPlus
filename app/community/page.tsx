'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, MessageSquare, ThumbsUp, Users } from 'lucide-react';

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Community
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Connect with fellow travelers, share experiences, and discover new perspectives.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {[
            {
              author: "Sarah Johnson",
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
              location: "New York City",
              content: "Just completed an amazing art tour through Chelsea! Here are my favorite galleries...",
              likes: 45,
              comments: 12,
              image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9"
            },
            {
              author: "Jean Pierre",
              avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
              location: "Paris",
              content: "Found this hidden gem of a café in Montmartre. The view of the city is breathtaking!",
              likes: 67,
              comments: 23,
              image: "https://images.unsplash.com/photo-1493707553966-283afac8c358"
            }
          ].map((post, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={post.avatar}
                  alt={post.author}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold">{post.author}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {post.location}
                  </div>
                </div>
              </div>
              <p className="mb-4">{post.content}</p>
              {post.image && (
                <img
                  src={post.image}
                  alt="Post content"
                  className="w-full rounded-lg mb-4 object-cover h-64"
                />
              )}
              <div className="flex gap-4">
                <Button variant="ghost" size="sm">
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  {post.likes}
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {post.comments}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Popular Explorers</h3>
            <div className="space-y-4">
              {[
                {
                  name: "Sarah Johnson",
                  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
                  followers: "2.5K"
                },
                {
                  name: "Jean Pierre",
                  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
                  followers: "1.8K"
                }
              ].map((explorer, index) => (
                <div key={index} className="flex items-center gap-4">
                  <img
                    src={explorer.avatar}
                    alt={explorer.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{explorer.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {explorer.followers} followers
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Follow</Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
    </main>
  );
}