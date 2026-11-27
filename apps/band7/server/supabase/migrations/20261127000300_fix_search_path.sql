-- Đặt search_path cố định cho các hàm không cần schema (Supabase security advisor 0011)
alter function public.recall_interval(int) set search_path = '';
alter function public.lock_plan_column() set search_path = '';
