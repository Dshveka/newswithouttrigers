create extension if not exists pgcrypto;

create table if not exists source_items (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  title text not null,
  url text not null,
  published_at timestamptz not null,
  fetched_at timestamptz not null,
  content_snippet text not null,
  hash text not null unique
);

create index if not exists idx_source_items_published_at on source_items (published_at desc);

create table if not exists clustered_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_key text not null,
  vital_now boolean not null,
  area text,
  security_status text,
  sources jsonb not null,
  summary_sentence text not null
);

create index if not exists idx_clustered_events_created_at on clustered_events (created_at desc);

create table if not exists digests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  digest_text text not null,
  sources jsonb not null
);

create index if not exists idx_digests_created_at on digests (created_at desc);
