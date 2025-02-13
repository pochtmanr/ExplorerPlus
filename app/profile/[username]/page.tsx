import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import ProfilePageClient from '../ProfilePageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const supabase = createServerComponentClient({ cookies });

  console.log('Fetching profile for username:', params.username);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      banner_url,
      bio,
      location,
      website,
      social_links,
      created_at,
      updated_at
    `)
    .eq('username', params.username)
    .single();

  if (error || !profile) {
    console.error('Profile fetch error:', error);
    return notFound();
  }

  // Get the actual URLs from Supabase Storage
  if (profile.avatar_url) {
    const { data: { publicUrl: avatarUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(profile.avatar_url.split('/').slice(-2).join('/'));
    profile.avatar_url = avatarUrl;
  }

  if (profile.banner_url) {
    const { data: { publicUrl: bannerUrl } } = supabase.storage
      .from('banners')
      .getPublicUrl(profile.banner_url.split('/').slice(-2).join('/'));
    profile.banner_url = bannerUrl;
  }

  console.log('Profile data:', {
    ...profile,
    avatar_url: profile.avatar_url,
    banner_url: profile.banner_url
  });

  return <ProfilePageClient profile={profile} />;
} 