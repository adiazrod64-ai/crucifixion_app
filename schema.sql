-- ============================================================
-- CRUCIFIXION APP — DATABASE SCHEMA
-- Paste this whole file into Supabase SQL Editor and click Run.
-- ============================================================

-- Profiles (extends Supabase's built-in auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Audiobooks & sermons
create table if not exists audiobooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  type text check (type in ('Audiobook', 'Sermon')) default 'Audiobook',
  tag text,
  duration_seconds int,
  file_url text not null,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Requests for content people want added (Library tab "recommendations")
create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  type text check (type in ('Audiobook', 'Sermon')) default 'Audiobook',
  votes int default 1,
  requested_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists request_votes (
  request_id uuid references requests(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (request_id, user_id)
);

-- Communities (parishes, groups)
create table if not exists communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_open boolean default true,
  join_code text unique,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists community_members (
  community_id uuid references communities(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (community_id, user_id)
);

create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references communities(id) on delete cascade,
  author_id uuid references profiles(id),
  text text,
  media_url text,
  media_type text check (media_type in ('image', 'video')),
  created_at timestamptz default now()
);

create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references community_posts(id) on delete cascade,
  author_id uuid references profiles(id),
  text text not null,
  created_at timestamptz default now()
);

-- Churches (Give tab)
create table if not exists churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  description text,
  paypal_handle text,
  cashapp_handle text,
  venmo_handle text,
  owned_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- App-level donation config (single row, admin-edited)
create table if not exists app_donation_config (
  id int primary key default 1,
  paypal_handle text,
  cashapp_handle text,
  check (id = 1)
);
insert into app_donation_config (id) values (1) on conflict do nothing;

-- News / blog posts
create table if not exists news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  author_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists bookmarks (
  user_id uuid references profiles(id) on delete cascade,
  news_post_id uuid references news_posts(id) on delete cascade,
  primary key (user_id, news_post_id)
);

-- Shared resources (articles/books/audio links)
create table if not exists shared_resources (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('Article', 'Book', 'Audio')) default 'Article',
  title text not null,
  url text,
  shared_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Marketplace items (future "Shop" tab)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents int,
  image_url text,
  active boolean default false,
  created_at timestamptz default now()
);

-- Moderation reports (human review queue)
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  content_type text check (content_type in ('post', 'comment', 'audiobook', 'news_post')),
  content_id uuid not null,
  reported_by uuid references profiles(id),
  reason text,
  status text check (status in ('pending', 'reviewed', 'removed')) default 'pending',
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- These rules run on Supabase's servers, so they apply no matter
-- what device or code calls the database — this is your real security
-- boundary, not just something enforced in the app's UI.
-- ============================================================

alter table profiles enable row level security;
alter table audiobooks enable row level security;
alter table requests enable row level security;
alter table request_votes enable row level security;
alter table communities enable row level security;
alter table community_members enable row level security;
alter table community_posts enable row level security;
alter table post_comments enable row level security;
alter table churches enable row level security;
alter table app_donation_config enable row level security;
alter table news_posts enable row level security;
alter table bookmarks enable row level security;
alter table shared_resources enable row level security;
alter table products enable row level security;
alter table reports enable row level security;

-- Public read on non-sensitive content
create policy "public read profiles" on profiles for select using (true);
create policy "public read audiobooks" on audiobooks for select using (true);
create policy "public read requests" on requests for select using (true);
create policy "public read open communities" on communities for select using (true);
create policy "public read churches" on churches for select using (true);
create policy "public read donation config" on app_donation_config for select using (true);
create policy "public read news" on news_posts for select using (true);
create policy "public read shared resources" on shared_resources for select using (true);
create policy "public read active products" on products for select using (active = true);

-- Community posts/comments: only members of that community can read
create policy "members read posts" on community_posts for select
  using (exists (select 1 from community_members m where m.community_id = community_posts.community_id and m.user_id = auth.uid()));
create policy "members read comments" on post_comments for select
  using (exists (
    select 1 from community_posts p join community_members m on m.community_id = p.community_id
    where p.id = post_comments.post_id and m.user_id = auth.uid()
  ));

-- Logged-in users can create content
create policy "users insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "users update own profile" on profiles for update using (auth.uid() = id);
create policy "auth users upload audiobooks" on audiobooks for insert with check (auth.uid() = uploaded_by);
create policy "auth users create requests" on requests for insert with check (auth.uid() = requested_by);
create policy "auth users vote" on request_votes for insert with check (auth.uid() = user_id);
create policy "auth users create communities" on communities for insert with check (auth.uid() = created_by);
create policy "auth users join communities" on community_members for insert with check (auth.uid() = user_id);
create policy "members post" on community_posts for insert with check (
  auth.uid() = author_id and exists (select 1 from community_members m where m.community_id = community_posts.community_id and m.user_id = auth.uid())
);
create policy "members comment" on post_comments for insert with check (auth.uid() = author_id);
create policy "auth users create church pages" on churches for insert with check (auth.uid() = owned_by);
create policy "owner updates church page" on churches for update using (auth.uid() = owned_by);
create policy "auth users write news" on news_posts for insert with check (auth.uid() = author_id);
create policy "users bookmark" on bookmarks for insert with check (auth.uid() = user_id);
create policy "users unbookmark" on bookmarks for delete using (auth.uid() = user_id);
create policy "auth users share resources" on shared_resources for insert with check (auth.uid() = shared_by);
create policy "any logged in user can report" on reports for insert with check (auth.uid() = reported_by);
