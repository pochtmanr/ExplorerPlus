'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Upload } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
    banner_url: '',
    bio: '',
    location: '',
    website: '',
    social_links: {},
  });
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        
        setUser(user);
        
        // Fetch existing profile
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError && fetchError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                username: `user_${user.id.slice(0, 8)}`,
                full_name: user.user_metadata?.full_name || '',
                avatar_url: user.user_metadata?.avatar_url || ''
              }
            ])
            .select()
            .single();

          if (insertError) {
            console.error('Profile creation error:', insertError);
            toast.error('Error creating profile');
            return;
          }

          if (newProfile) {
            setProfile({
              username: newProfile.username || '',
              full_name: newProfile.full_name || '',
              avatar_url: newProfile.avatar_url || '',
              banner_url: newProfile.banner_url || '',
              bio: newProfile.bio || '',
              location: newProfile.location || '',
              website: newProfile.website || '',
              social_links: newProfile.social_links || {},
            });
          }
        } else if (existingProfile) {
          setProfile({
            username: existingProfile.username || '',
            full_name: existingProfile.full_name || '',
            avatar_url: existingProfile.avatar_url || '',
            banner_url: existingProfile.banner_url || '',
            bio: existingProfile.bio || '',
            location: existingProfile.location || '',
            website: existingProfile.website || '',
            social_links: existingProfile.social_links || {},
          });
        }
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error('Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const uploadImage = async (file: File, bucket: 'avatars' | 'banners') => {
    try {
      if (!user) throw new Error('No user');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      // Upload image
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // Update profile
      await supabase
        .from('profiles')
        .update({
          [`${bucket === 'avatars' ? 'avatar_url' : 'banner_url'}`]: publicUrl
        })
        .eq('id', user.id);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      setLoading(true);
      const bucket = type === 'avatar' ? 'avatars' : 'banners';
      const publicUrl = await uploadImage(file, bucket);

      // Update profile state
      setProfile(prev => ({
        ...prev,
        [type === 'avatar' ? 'avatar_url' : 'banner_url']: publicUrl
      }));

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          [type === 'avatar' ? 'avatar_url' : 'banner_url']: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success(`${type === 'avatar' ? 'Profile picture' : 'Banner'} updated successfully`);
      router.refresh(); // Force refresh to update the UI
    } catch (error: any) {
      toast.error(error.message || `Error uploading ${type}`);
      console.error('Image upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (
    e?: React.FormEvent, 
    newImageUrl?: string, 
    imageType?: 'avatar' | 'banner'
  ) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      if (!profile.username.trim()) {
        throw new Error('Username is required');
      }

      // Check if username is taken by another user
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', profile.username)
        .neq('id', user.id);

      if (checkError) throw checkError;
      
      if (existingUsers && existingUsers.length > 0) {
        throw new Error('Username is already taken');
      }

      const updateData = imageType ? {
        ...profile,
        [`${imageType}_url`]: newImageUrl
      } : profile;

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updateData,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      if (!imageType) toast.success('Profile updated successfully');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Error updating password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (confirm) {
      setLoading(true);
      try {
        // Delete profile (this will cascade to all user data due to FK constraints)
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);

        if (deleteError) throw deleteError;

        // Delete auth user
        const { error: authError } = await supabase.auth.admin.deleteUser(
          user.id
        );

        if (authError) throw authError;

        toast.success('Account deleted successfully');
        router.push('/login');
      } catch (error: any) {
        toast.error(error.message || 'Error deleting account');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Email: {user?.email}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback>{profile.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'avatar')}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Banner Image</Label>
                  <div className="space-y-2">
                    {profile.banner_url && (
                      <div className="relative h-32 rounded-lg overflow-hidden">
                        <img 
                          src={profile.banner_url} 
                          alt="Banner preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'banner')}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={profile.username}
                  onChange={(e) => setProfile({...profile, username: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={profile.full_name}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={profile.location}
                  onChange={(e) => setProfile({...profile, location: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={profile.website}
                  onChange={(e) => setProfile({...profile, website: e.target.value})}
                  type="url"
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  required
                />
              </div>

              <Button type="submit" disabled={loading}>
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              Once you delete your account, there is no going back. Please be certain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 