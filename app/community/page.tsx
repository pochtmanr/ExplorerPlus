'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, MessageSquare, ThumbsUp, Users, PlusCircle, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
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
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform the posts to include public URLs
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
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleDelete = async (postId: string) => {
    try {
      // First get the post to get image URLs
      const { data: post } = await supabase
        .from('posts')
        .select('image_urls')
        .eq('id', postId)
        .single();

      // Delete images from storage if they exist
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

      // Delete the post from the database
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      setPosts(posts.filter(post => post.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Error deleting post');
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-12">
          <div className="flex flex-col items-start">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Community
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Connect with fellow travelers, share experiences, and discover new perspectives.
            </p>
          </div>
          <Link href="/community/create">
            <Button className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Create Post
            </Button>
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {loading ? (
              <div className="text-center text-muted-foreground">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center text-muted-foreground">No posts yet</div>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={post.profiles.avatar_url} />
                        <AvatarFallback>
                          {post.profiles.username?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {post.profiles.full_name || post.profiles.username}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {post.location}
                          <span className="mx-2">•</span>
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    {currentUser && post.user_id === currentUser.id && (
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