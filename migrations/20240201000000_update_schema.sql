-- Add new columns for social features and route details
alter table profiles
  add column banner_url text,
  add column social_links jsonb;

alter table routes
  add column is_featured boolean default false,
  add column route_path geography(linestring, 4326),
  add column tags text[],
  add column start_point geography(point, 4326);

alter table posts
  add column experience_type text check (experience_type in ('culture', 'nature', 'food', 'adventure')),
  add column rating numeric(2,1);

-- Create new tables for saved locations and travel history
create table saved_locations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  address text not null,
  coordinates geography(point, 4326) not null,
  type text not null check (type in ('hotel', 'attraction', 'restaurant')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table travel_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  location text not null,
  coordinates geography(point, 4326) not null,
  start_date date not null,
  end_date date not null,
  experiences text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update policies for new features
create policy "Users can manage their travel history" on travel_history
  for all using (auth.uid() = user_id);

create policy "Public featured routes are viewable" on routes
  for select using (is_featured = true);

create policy "Users can manage their saved locations" on saved_locations
  for all using (auth.uid() = user_id);

-- Create indexes for new columns
create index idx_routes_featured on routes (is_featured);
create index idx_posts_experience on posts (experience_type);
create index idx_travel_history_dates on travel_history (start_date, end_date);

-- Make username required in profiles table
alter table profiles 
  alter column username set not null;

-- Add a trigger to auto-generate username if not provided
create or replace function generate_username()
returns trigger as $$
begin
  if new.username is null then
    new.username := 'user_' || substr(new.id::text, 1, 8);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger ensure_username
  before insert on profiles
  for each row
  execute function generate_username(); 