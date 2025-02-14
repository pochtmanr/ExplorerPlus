'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ExplorePage() {
  const [explorePosts, setExplorePosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExplorePosts();
  }, []);

  const fetchExplorePosts = async () => {
    try {
      const { data, error } = await supabase
        .from('explore_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExplorePosts(data || []);
    } catch (error) {
      console.error('Error fetching explore posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = explorePosts.filter(post =>
    post.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden group">
                <div className="relative aspect-[4/3]">
                  <img
                    src={post.image_url}
                    alt={post.city}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-semibold">{post.city}</h3>
                    <p className="text-sm opacity-90">
                      {post.routes_count} routes • {post.rating} rating
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <Button className="w-full" asChild>
                    <Link href={`/explore/${post.slug}`}>
                      Explore Routes
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}