'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Link2, Calendar, Globe, Twitter, Instagram } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  social_links?: Record<string, string>;
}

export default function ProfilePageClient({ profile }: { profile: Profile }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserContent = async () => {
      const [postsResponse, routesResponse] = await Promise.all([
        supabase
          .from('posts')
          .select('*, profiles(username, avatar_url)')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('routes')
          .select('*, profiles(username, avatar_url)')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
      ]);

      setPosts(postsResponse.data || []);
      setRoutes(routesResponse.data || []);
    };

    fetchUserContent();
  }, [profile.id]);

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-muted">
        {profile.banner_url ? (
          <img 
            src={profile.banner_url} 
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/10" />
        )}
      </div>

      {/* Profile Info */}
      <div className="container max-w-6xl mx-auto px-4">
        <div className="relative -mt-20 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage 
                src={profile.avatar_url || ''} 
                alt={profile.username}
              />
              <AvatarFallback>{profile.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
              {profile.bio && (
                <p className="text-foreground/90 max-w-2xl">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                {profile.website && (
                  <a 
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                {profile.social_links?.twitter && (
                  <a 
                    href={profile.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </a>
                )}
                {profile.social_links?.instagram && (
                  <a 
                    href={profile.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0">
            <TabsTrigger 
              value="posts"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Posts ({posts.length})
            </TabsTrigger>
            <TabsTrigger 
              value="routes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Routes ({routes.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.profiles.avatar_url} />
                      <AvatarFallback>{post.profiles.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{post.profiles.username}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(post.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-foreground/90">{post.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="routes" className="space-y-4">
            {routes.map((route) => (
              <Card key={route.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{route.name}</h3>
                      <p className="text-muted-foreground">{route.description}</p>
                      {route.distance && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Distance: {route.distance} km
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 