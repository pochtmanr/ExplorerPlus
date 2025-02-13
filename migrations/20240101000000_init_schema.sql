-- Create tables
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  location text,
  website text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table itineraries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  accommodation_address text not null,
  accommodation_coordinates geography(point, 4326) not null,
  number_of_days integer not null,
  transport_modes text[] not null,
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table itinerary_days (
  id uuid primary key default uuid_generate_v4(),
  itinerary_id uuid references itineraries(id) on delete cascade not null,
  day_number integer not null,
  total_distance numeric not null,
  total_duration numeric not null,
  start_time time not null,
  end_time time not null
);

create table places (
  id uuid primary key default uuid_generate_v4(),
  itinerary_day_id uuid references itinerary_days(id) on delete cascade not null,
  name text not null,
  description text,
  duration text not null,
  address text not null,
  type text not null check (type in ('accommodation', 'food', 'attraction', 'outdoor')),
  coordinates geography(point, 4326) not null,
  order_index integer not null
);

create table routes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  image_url text,
  duration text not null,
  distance numeric not null,
  city text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  location text not null,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table likes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

create table comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table followers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  follower_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, follower_id)
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table itineraries enable row level security;
alter table itinerary_days enable row level security;
alter table places enable row level security;
alter table routes enable row level security;
alter table posts enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;
alter table followers enable row level security;

-- Security Policies
-- Profiles
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- Itineraries
create policy "Users can manage their itineraries" on itineraries
  for all using (auth.uid() = user_id);

-- Routes
create policy "Public routes are viewable by everyone" on routes
  for select using (true);

create policy "Users can manage their routes" on routes
  for all using (auth.uid() = user_id);

-- Posts
create policy "Public posts are viewable by everyone" on posts
  for select using (true);

create policy "Users can create posts" on posts
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own posts" on posts
  for update using (auth.uid() = user_id);

create policy "Users can delete their own posts" on posts
  for delete using (auth.uid() = user_id);

-- Likes
create policy "Users can manage their likes" on likes
  for all using (auth.uid() = user_id);

-- Comments
create policy "Users can manage their comments" on comments
  for all using (auth.uid() = user_id);

-- Followers
create policy "Users can manage their followers" on followers
  for all using (auth.uid() = follower_id);

-- Indexes
create index idx_itineraries_user_id on itineraries (user_id);
create index idx_routes_city on routes (city);
create index idx_posts_location on posts (location);
create index idx_followers_relationship on followers (user_id, follower_id); 