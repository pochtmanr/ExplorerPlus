import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyawgndrpyxkyjrnnvgs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YXdnbmRycHl4a3lqcm5udmdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4MDE2OTYsImV4cCI6MjA1NDM3NzY5Nn0.NizHC2Tfav4w-_YYhlJ54tprjogPMB3E7_-bpobSY5o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 