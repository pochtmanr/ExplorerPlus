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
import CommentSection from '@/components/CommentSection';

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [popularExplorers, setPopularExplorers] = useState<any[]>([]);
  const router = useRouter();

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
          ),
          likes:likes(user_id),
          comments:comments(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the posts to include public URLs and likes info
      const transformedPosts = data?.map((post) => {
        const userHasLiked = post.likes.some((like: any) => like.user_id === currentUser?.id);
        const likesCount = post.likes.length;
        const commentsCount = post.comments?.[0]?.count || 0;

        if (post.image_urls && post.image_urls.length > 0) {
          const publicUrls = post.image_urls.map((fileName: string) => {
            const { data: { publicUrl } } = supabase.storage
              .from('posts')
              .getPublicUrl(fileName);
            return publicUrl;
          });
          return { 
            ...post, 
            image_urls: publicUrls,
            user_has_liked: userHasLiked,
            likes_count: likesCount,
            comments_count: commentsCount
          };
        }
        return { 
          ...post,
          user_has_liked: userHasLiked,
          likes_count: likesCount,
          comments_count: commentsCount
        };
      }) || [];

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [currentUser]); // Re-fetch when currentUser changes

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(prev => ({ ...prev, [postId]: data }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return;

    try {
      const { data: existingLike } = await supabase
        .from('likes')
        .select()
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: currentUser.id
          });
      }

      // Refresh posts to update like count
      fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Error updating like');
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
      fetchPosts(); // Fetch fresh data after deletion
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Error deleting post');
    }
  };

  const fetchPopularExplorers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          avatar_url,
          followers:profile_followers(count)
        `)
        .order('followers', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Transform the data to include public URLs and follower count
      const transformedExplorers = data?.map((explorer) => {
        const followerCount = explorer.followers?.[0]?.count || 0;
        const avatarUrl = explorer.avatar_url 
          ? supabase.storage.from('avatars').getPublicUrl(explorer.avatar_url).data.publicUrl
          : null;

        return {
          ...explorer,
          avatar_url: avatarUrl,
          follower_count: followerCount
        };
      }) || [];

      setPopularExplorers(transformedExplorers);
    } catch (error) {
      console.error('Error fetching popular explorers:', error);
    }
  };

  useEffect(() => {
    fetchPopularExplorers();
  }, []);

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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleLike(post.id)}
                    >
                      <ThumbsUp 
                        className={`w-4 h-4 mr-2 ${post.user_has_liked ? 'fill-current' : ''}`} 
                      />
                      {post.likes_count || 0}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }));
                        if (!comments[post.id]) {
                          fetchComments(post.id);
                        }
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {post.comments_count || 0}
                    </Button>
                  </div>
                  {showComments[post.id] && (
                    <div className="mt-4">
                      <CommentSection
                        postId={post.id}
                        currentUser={currentUser}
                        comments={comments[post.id] || []}
                        onCommentAdded={() => {
                          fetchComments(post.id);
                          fetchPosts(); // Refresh post to update comment count
                        }}
                      />
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Popular Explorers</h3>
              <div className="space-y-4">
                {popularExplorers.map((explorer) => (
                  <div key={explorer.id} className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={explorer.avatar_url} />
                      <AvatarFallback>
                        {explorer.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {explorer.full_name || explorer.username}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {explorer.follower_count} followers
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/profile/${explorer.username}`)}
                    >
                      View Profile
                    </Button>
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