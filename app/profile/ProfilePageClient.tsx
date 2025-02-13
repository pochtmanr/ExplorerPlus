'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Link2, Calendar, Globe, Twitter, Instagram, ThumbsUp, MessageSquare, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

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

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedPosts = data?.map((post) => {
        if (post.image_urls && post.image_urls.length > 0) {
          const publicUrls = post.image_urls.map((fileName: string) => {
            const { data: { publicUrl } } = supabase.storage
              .from('posts')
              .getPublicUrl(fileName);
            return publicUrl;
          });
          return { ...post, image_urls: publicUrls };
        }
        return post;
      }) || [];

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { data: post } = await supabase
        .from('posts')
        .select('image_urls')
        .eq('id', postId)
        .single();

      if (post?.image_urls) {
        for (const fileName of post.image_urls) {
          const { error: storageError } = await supabase.storage
            .from('posts')
            .remove([fileName]);
          
          if (storageError) {
            console.error('Error deleting image:', storageError);
          }
        }
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      toast.success('Post deleted successfully');
      await fetchUserPosts(); // Fetch fresh data after deletion
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Error deleting post');
    }
  };

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
            {loading ? (
              <div className="text-center text-muted-foreground">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center text-muted-foreground">No posts yet</div>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {post.location}
                      <span className="mx-2">•</span>
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </div>
                    {currentUser && currentUser.id === profile.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/community/edit/${post.id}`)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className="grid gap-2 mb-4">
                      {post.image_urls.map((url: string, index: number) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Post image ${index + 1}`}
                          className="w-full rounded-lg object-cover max-h-96"
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4">
                    <Button variant="ghost" size="sm">
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      {post.likes_count || 0}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {post.comments_count || 0}
                    </Button>
                  </div>
                </Card>
              ))
            )}
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