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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!profile.username.trim()) {
        throw new Error('Username is required');
      }

      // Check if username is taken by another user
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', profile.username)
        .neq('id', user.id)
        .single();

      if (existingUser) {
        throw new Error('Username is already taken');
      }

      // Update profile using upsert
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          banner_url: profile.banner_url,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          social_links: profile.social_links,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error('Error updating profile');
      }

      toast.success('Profile updated successfully');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Error updating profile');
      console.error('Profile update error:', error);
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

              <div className="space-y-2">
                <Label>Avatar URL</Label>
                <Input
                  value={profile.avatar_url}
                  onChange={(e) => setProfile({...profile, avatar_url: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Banner URL</Label>
                <Input
                  value={profile.banner_url}
                  onChange={(e) => setProfile({...profile, banner_url: e.target.value})}
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