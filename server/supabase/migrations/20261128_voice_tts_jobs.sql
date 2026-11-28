-- Giọng đọc AI (voice-tts), phần 1 (đã áp dụng trên nam-core): hàng đợi đoạn, trạng thái, kho tệp, lịch chạy.
-- Gói miễn phí của Gemini: mỗi lần cron gọi, voice-tts đọc một đoạn; hết lượt thì cả hàng tạm dừng.
create schema if not exists voice;
revoke all on schema voice from public, anon, authenticated;

create table voice.jobs (
  id          text primary key,                 -- '<bài>.p<n>'
  app         text not null default 'thanh-tam',
  item_id     text not null,
  part        int  not null,
  parts       int  not null,
  kind        text not null check (kind in ('khan','kinh')),
  item_hash   text not null,                    -- đổi nội dung bài thì đọc lại
  script      text not null,                    -- văn bản gửi đi, mỗi câu một dòng
  cue_ids     int[] not null,                   -- chỉ số câu (cue) ứng với từng dòng
  priority    int  not null default 100,        -- nhỏ làm trước
  status      text not null default 'pending' check (status in ('pending','running','done','failed')),
  tries       int  not null default 0,
  next_at     timestamptz not null default now(),
  model       text,
  voice_name  text,
  audio_path  text,
  bytes       int,
  ms          int,
  error       text,
  updated_at  timestamptz not null default now()
);
create index jobs_due on voice.jobs (priority, id) where status in ('pending','running');
alter table voice.jobs enable row level security;

create table voice.state (key text primary key, value jsonb not null);
alter table voice.state enable row level security;
insert into voice.state values
  ('paused_until', to_jsonb(now())),
  ('config', jsonb_build_object('voice','Charon','prefer', jsonb_build_array('3.8-flash-tts','3.1-flash-tts','2.5-flash-preview-tts','flash-lite-tts'),'max_tries', 6));

-- Lấy một đoạn đến lượt, giữ chỗ 10 phút (chết giữa chừng thì tự về hàng đợi).
create or replace function public.nc_voice_next()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare j voice.jobs; v_cfg jsonb;
begin
  if (select (value #>> '{}')::timestamptz from voice.state where key = 'paused_until') > now() then
    return null;
  end if;
  select * into j from voice.jobs
   where status in ('pending','running') and next_at <= now()
   order by priority, id limit 1 for update skip locked;
  if not found then return null; end if;
  update voice.jobs set status = 'running', tries = tries + 1, next_at = now() + interval '10 minutes', updated_at = now()
   where id = j.id;
  select value into v_cfg from voice.state where key = 'config';
  return jsonb_build_object('id', j.id, 'app', j.app, 'kind', j.kind, 'script', j.script, 'tries', j.tries + 1,
                            'item_hash', j.item_hash, 'config', v_cfg);
end $$;

create or replace function public.nc_voice_done(p_id text, p_path text, p_bytes int, p_ms int, p_model text, p_voice text)
returns void language sql security definer set search_path = '' as $$
  update voice.jobs set status = 'done', audio_path = p_path, bytes = p_bytes, ms = p_ms, model = p_model,
         voice_name = p_voice, error = null, updated_at = now() where id = p_id;
$$;

-- Hết lượt: tạm dừng cả hàng tới p_pause_until, trả đoạn về chờ. Lỗi khác: thử lại sau, quá số lần thì 'failed'.
create or replace function public.nc_voice_fail(p_id text, p_error text, p_pause_until timestamptz default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_max int;
begin
  select coalesce((value->>'max_tries')::int, 6) into v_max from voice.state where key = 'config';
  if p_pause_until is not null then
    update voice.state set value = to_jsonb(p_pause_until) where key = 'paused_until';
    update voice.jobs set status = 'pending', tries = greatest(tries - 1, 0), next_at = now(), error = left(p_error, 500), updated_at = now()
     where id = p_id;
  else
    update voice.jobs set status = case when tries >= v_max then 'failed' else 'pending' end,
           next_at = now() + make_interval(mins => 5 * tries), error = left(p_error, 500), updated_at = now()
     where id = p_id;
  end if;
end $$;

revoke all on function public.nc_voice_next(), public.nc_voice_done(text,text,int,int,text,text),
  public.nc_voice_fail(text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.nc_voice_next(), public.nc_voice_done(text,text,int,int,text,text),
  public.nc_voice_fail(text,text,timestamptz) to service_role;

-- Kho tệp công khai (chỉ đọc), ghi bằng service role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voice', 'voice', true, 52428800, array['audio/wav','application/json'])
on conflict (id) do nothing;

-- Cron 5 phút một lần (lệnh đầy đủ ở phần 2).
select cron.schedule('voice-tts', '*/5 * * * *', $$ select 1 $$);
