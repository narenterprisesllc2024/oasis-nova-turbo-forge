-- Sovi HUD: per-user settings, transcript, alerts, and command log

create table if not exists sovi_settings (
  user_id text primary key,
  wake_word text not null default 'Sovi',
  voice_id text not null default 'orion',
  always_listen boolean not null default false,
  vps_url text,
  vps_token text,
  chat_path text not null default '/v1/chat/completions',
  command_path text not null default '/sovi/command',
  brain_mode text not null default 'cloud',
  notify_push boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists sovi_messages (
  id serial primary key,
  user_id text not null,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists sovi_messages_user_idx on sovi_messages (user_id, created_at desc);

create table if not exists sovi_alerts (
  id serial primary key,
  user_id text not null,
  title text not null,
  body text not null,
  level text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists sovi_alerts_user_idx on sovi_alerts (user_id, created_at desc);

create table if not exists sovi_ops (
  id serial primary key,
  user_id text not null,
  command text not null,
  status text not null,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists sovi_ops_user_idx on sovi_ops (user_id, created_at desc);
