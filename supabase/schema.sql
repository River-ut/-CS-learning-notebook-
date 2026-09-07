-- ============================================================
-- CS学习记事本 — Supabase 建表脚本
-- 用法：在 Supabase 项目 Dashboard → SQL Editor 中粘贴并运行本脚本
-- ============================================================

-- 笔记表
create table if not exists public.notes (
  id         uuid primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text default '',
  category   text default 'ds-algo',
  content    text default '',
  is_pinned  boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 自定义分类表
create table if not exists public.categories (
  id      text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name    text not null,
  icon    text default '📁',
  primary key (id, user_id)
);

-- 自动填充 user_id：由 auth.uid() 决定，前端无法伪造
create or replace function public.set_user_id() returns trigger as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists notes_set_user_id on public.notes;
create trigger notes_set_user_id before insert on public.notes
  for each row execute function public.set_user_id();

drop trigger if exists categories_set_user_id on public.categories;
create trigger categories_set_user_id before insert on public.categories
  for each row execute function public.set_user_id();

-- 行级安全（RLS）：每个用户只能读写自己的数据
alter table public.notes      enable row level security;
alter table public.categories enable row level security;

drop policy if exists "own notes" on public.notes;
create policy "own notes" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own categories" on public.categories;
create policy "own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
