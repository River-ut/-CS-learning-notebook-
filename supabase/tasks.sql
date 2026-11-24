-- 在现有 Supabase 项目的 SQL Editor 中执行；不改动现有笔记。
create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text not null default '',
  category text not null default '生活' check (char_length(category) between 1 and 60),
  priority text not null default 'normal' check (priority in ('high', 'normal', 'low')),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  due_at timestamptz,
  note_id uuid,
  logs jsonb not null default '[]'::jsonb check (jsonb_typeof(logs) = 'array'),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_due_idx on public.tasks(user_id, due_at);
alter table public.tasks enable row level security;
drop policy if exists "own tasks" on public.tasks;
create policy "own tasks" on public.tasks for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.tasks to authenticated;
revoke all on public.tasks from anon;
