import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Force dynamic execution so that the session is re-read on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return redirect('/login');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single();

    return redirect(`/profile/${profile?.username || `user_${session.user.id.slice(0, 8)}`}`);
  } catch (error) {
    console.error('Profile page error:', error);
    return redirect('/login');
  }
} 