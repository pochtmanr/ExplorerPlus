'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Link2, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfilePageClient({ profile }: { profile: any }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchData = async () => {
      const [postsResponse, routesResponse] = await Promise.all([
        supabase.from('posts').select('*').eq('user_id', profile.id),
        supabase.from('routes').select('*').eq('user_id', profile.id)
      ]);

      setPosts(postsResponse.data || []);
      setRoutes(routesResponse.data || []);
    };

    fetchData();
  }, [profile?.id]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>{profile.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
              {profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}
              <div className="flex items-center gap-4">
                {profile.location && (
                  <span className="flex items-center text-muted-foreground">
                    <MapPin className="mr-1 h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                     className="flex items-center text-muted-foreground hover:text-primary">
                    <Link2 className="mr-1 h-4 w-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="routes">Routes ({routes.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          {/* Posts content */}
        </TabsContent>
        <TabsContent value="routes">
          {/* Routes content */}
        </TabsContent>
      </Tabs>
    </div>
  );
} 