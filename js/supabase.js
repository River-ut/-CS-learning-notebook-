// ============================================================
// SUPABASE — 客户端单例 + 字段映射
// ============================================================
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

// 未配置时 supabase 为 null，避免 createClient('') 在模块加载时抛错
export const supabase = isConfigured ? createClient(url, anonKey) : null;

if (!isConfigured) {
  console.warn('未配置 Supabase：请复制 .env.example 为 .env 并填入 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

// 笔记对象（JS camelCase）→ 数据库行（snake_case），不含 user_id（由数据库触发器自动填充）
export function noteToRow(note) {
  return {
    id: note.id,
    title: note.title,
    category: note.category,
    content: note.content,
    is_pinned: note.isPinned,
    created_at: note.createdAt,
    updated_at: note.updatedAt
  };
}

// 数据库行 → 笔记对象
export function rowToNote(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
