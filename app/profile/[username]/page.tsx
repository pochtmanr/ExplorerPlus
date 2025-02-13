import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import ProfilePageClient from '../ProfilePageClient';

// Add dynamic configuration
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

// Remove generateStaticParams since we want dynamic behavior
export default async function ProfilePage({ params }: { params: { username: string } }) {
  const supabase = createServerComponentClient({ cookies });

  let query = supabase
    .from('profiles')
    .select('*');

  // Handle both username and user_id prefix cases
  if (params.username.startsWith('user_')) {
    query = query.eq('username', params.username);
  } else {
    query = query.eq('username', params.username);
  }

  const { data: profile, error } = await query.single();

  if (error || !profile) {
    console.error('Profile fetch error:', error);
    return notFound();
  }

  return <ProfilePageClient profile={profile} />;
}