-- Band7 · schema lõi: hồ sơ, lộ trình, buổi nói, quota, vòng sửa lỗi
-- Chạy bằng: supabase db push

create extension if not exists pgcrypto;

-- ───────────── Hồ sơ & mục tiêu ─────────────
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text,
  target_band      numeric(2,1) not null default 7.0 check (target_band between 4.0 and 9.0),
  exam_date        date,
  minutes_per_day  smallint not null default 30 check (minutes_per_day between 10 and 180),
  days_per_week    smallint not null default 6 check (days_per_week between 1 and 7),
  purpose          text check (purpose in ('study','migrate','work','graduate','other')),
  accent           text not null default 'uk' check (accent in ('uk','us','au')),
  speech_rate      text not null default 'exam' check (speech_rate in ('slow','exam')),
  correction_level text not null default 'medium' check (correction_level in ('light','medium','strict')),
  explain_lang     text not null default 'vi' check (explain_lang in ('vi','en')),
  plan             text not null default 'free' check (plan in ('free','pro')),
  created_at       timestamptz not null default now()
);

-- Band theo thời gian; 'real_exam' = điểm thi thật người dùng nhập để hiệu chỉnh chấm
create table public.band_snapshots (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  source     text not null check (source in ('placement','session','mock','real_exam')),
  fc numeric(2,1), lr numeric(2,1), gra numeric(2,1), p numeric(2,1),
  overall    numeric(2,1),
  session_id uuid,
  created_at timestamptz not null default now()
);
create index on public.band_snapshots (user_id, created_at desc);

create table public.study_plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  version    int not null default 1,
  is_active  boolean not null default true,
  phases     jsonb not null,      -- [{name, weeks:[from,to], focus, target_band}]
  allocation jsonb not null,      -- {"GRA":0.38,"LR":0.26,"P":0.2,"FC":0.16}
  reason     text,                -- vì sao tạo/điều chỉnh phiên bản này
  created_at timestamptz not null default now()
);
create unique index study_plans_one_active on public.study_plans (user_id) where is_active;

-- ───────────── Đề & buổi nói ─────────────
create table public.topics (
  id        uuid primary key default gen_random_uuid(),
  part      smallint not null check (part in (1,2,3)),
  title     text not null,
  questions jsonb not null,        -- part 1/3: ["..."], part 2: {"cue":"...","bullets":[...]}
  tags      text[] not null default '{}',
  quarter   text,                  -- '2026Q4'
  created_at timestamptz not null default now()
);
create index on public.topics (part, quarter);

create table public.sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('placement','part1','part2','part3','mock','free','repair')),
  mode       text not null default 'practice' check (mode in ('practice','exam')),
  topic_id   uuid references public.topics(id),
  state      jsonb not null default '{}',   -- {"active_target": "<learner_error id>", "asked_targets": [...]}
  scores     jsonb,
  started_at timestamptz not null default now(),
  ended_at   timestamptz
);
create index on public.sessions (user_id, started_at desc);

create table public.turns (
  id         bigint generated always as identity primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('examiner','learner')),
  text       text not null,
  audio_path text,
  duration_ms int,
  created_at timestamptz not null default now()
);
create index on public.turns (session_id, id);

-- Quota lượt nói mỗi ngày (giờ VN)
create table public.daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  turns   int  not null default 0,
  bonus   int  not null default 0,      -- lượt thưởng từ quảng cáo
  primary key (user_id, day)
);

-- ───────────── Vòng sửa lỗi ─────────────
-- Kho lỗi đặc trưng người Việt (dữ liệu chung, chỉ đọc với người dùng)
create table public.error_codes (
  code          text primary key,       -- 'VN-07'
  category      text not null check (category in ('GRA','LR','P','FC')),
  title_vi      text not null,
  explain_vi    text not null,          -- so sánh với tiếng Việt
  wrong_example text not null,
  right_example text not null,
  elicit_hint   text not null           -- gợi ý cho giám khảo: hỏi gì để buộc dùng lại cấu trúc
);

-- Lỗi của từng người học
create table public.learner_errors (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  code            text references public.error_codes(code),
  category        text not null check (category in ('GRA','LR','P','FC')),
  dedupe_key      text not null,        -- code, hoặc câu đúng đã chuẩn hoá khi không có code
  wrong_text      text not null,        -- chính câu người học nói
  right_text      text not null,
  band7_text      text,                 -- câu của người học ở band 7
  explain_vi      text,
  status          text not null default 'repairing'
                  check (status in ('repairing','recalling','closed')),
  repair_ok       smallint not null default 0,   -- số lần nói lại đúng ở bước Sửa ngay (cần 2)
  stage           smallint not null default 0,   -- chỉ số mốc gài lại: 0→1 ngày,1→3,2→7,3→14
  streak          smallint not null default 0,   -- số lần đúng liên tiếp khi bị gài (cần 3 để đóng)
  occurrences     int not null default 1,
  next_due_at     timestamptz,                   -- lần gài lại tiếp theo (cả kiểm tra giữ lâu sau khi đóng)
  closed_at       timestamptz,
  last_seen_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index learner_errors_due on public.learner_errors (user_id, next_due_at)
  where next_due_at is not null;

create table public.error_events (
  id         bigint generated always as identity primary key,
  error_id   uuid not null references public.learner_errors(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('caught','repair_ok','repair_fail','recall_ok','recall_fail')),
  turn_id    bigint references public.turns(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.error_events (error_id, created_at);

create table public.vocab_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  phrase      text not null,
  meaning_vi  text,
  example     text,
  topic_tag   text,
  stage       smallint not null default 0,
  next_due_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (user_id, phrase)
);

-- ───────────── State machine vòng sửa lỗi ─────────────
-- Mốc gài lại: 1, 3, 7, 14 ngày. Sau khi đóng vẫn kiểm tra giữ lâu ở mốc 14 ngày.
create or replace function public.recall_interval(p_stage int)
returns interval language sql immutable as $$
  select (array[1,3,7,14])[least(greatest(p_stage,0),3) + 1] * interval '1 day'
$$;

-- Ghi nhận lỗi mới hoặc lỗi lặp lại. Trả về id lỗi.
create or replace function public.catch_error(
  p_user uuid, p_code text, p_category text, p_wrong text, p_right text,
  p_band7 text, p_explain text, p_turn bigint default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_key text := coalesce(p_code, lower(regexp_replace(trim(p_right), '\s+', ' ', 'g')));
  v_id  uuid;
begin
  insert into learner_errors (user_id, code, category, dedupe_key, wrong_text, right_text, band7_text, explain_vi)
  values (p_user, p_code, p_category, v_key, p_wrong, p_right, p_band7, p_explain)
  on conflict (user_id, dedupe_key) do update set
    occurrences  = learner_errors.occurrences + 1,
    wrong_text   = excluded.wrong_text,         -- giữ câu sai mới nhất để người học nhận ra mình
    band7_text   = coalesce(excluded.band7_text, learner_errors.band7_text),
    last_seen_at = now(),
    -- mắc lại (dù đang gài hay đã đóng) → quay về bước Sửa ngay
    status       = 'repairing',
    repair_ok    = 0,
    stage        = 0,
    streak       = 0,
    closed_at    = null,
    next_due_at  = null
  returning id into v_id;

  insert into error_events (error_id, user_id, kind, turn_id) values (v_id, p_user, 'caught', p_turn);
  return v_id;
end $$;

-- Áp dụng kết quả một lần luyện: repair_ok | repair_fail | recall_ok | recall_fail
create or replace function public.apply_error_event(
  p_user uuid, p_error uuid, p_kind text, p_turn bigint default null
) returns public.learner_errors language plpgsql security definer set search_path = public as $$
declare e learner_errors;
begin
  select * into e from learner_errors where id = p_error and user_id = p_user for update;
  if not found then raise exception 'error % not found for user', p_error; end if;

  if p_kind = 'repair_ok' then
    e.repair_ok := e.repair_ok + 1;
    if e.repair_ok >= 2 and e.status = 'repairing' then
      e.status := 'recalling'; e.stage := 0; e.streak := 0;
      e.next_due_at := now() + recall_interval(0);
    end if;
  elsif p_kind = 'repair_fail' then
    null;                                           -- chỉ ghi sự kiện, nói lại tiếp
  elsif p_kind = 'recall_ok' then
    e.streak := e.streak + 1;
    if e.status = 'closed' then                     -- qua bài kiểm tra giữ lâu
      e.next_due_at := null;
    elsif e.streak >= 3 then
      e.status := 'closed'; e.closed_at := now(); e.stage := 3;
      e.next_due_at := now() + recall_interval(3);  -- kiểm tra lại ở mốc 14 ngày
    else
      e.stage := least(e.stage + 1, 3);
      e.next_due_at := now() + recall_interval(e.stage);
    end if;
  elsif p_kind = 'recall_fail' then
    e.status := 'recalling'; e.closed_at := null;
    e.stage := 0; e.streak := 0; e.occurrences := e.occurrences + 1;
    e.next_due_at := now() + recall_interval(0);
  else
    raise exception 'unknown kind %', p_kind;
  end if;

  update learner_errors set
    status = e.status, repair_ok = e.repair_ok, stage = e.stage, streak = e.streak,
    occurrences = e.occurrences, next_due_at = e.next_due_at, closed_at = e.closed_at,
    last_seen_at = now()
  where id = e.id;

  insert into error_events (error_id, user_id, kind, turn_id) values (e.id, p_user, p_kind, p_turn);
  return e;
end $$;

-- Lỗi đến hạn gài lại (gồm cả kiểm tra giữ lâu của lỗi đã đóng)
create or replace function public.due_recalls(p_user uuid, p_limit int default 3)
returns setof public.learner_errors language sql stable security definer set search_path = public as $$
  select * from learner_errors
  where user_id = p_user and next_due_at is not null and next_due_at <= now()
    and status in ('recalling','closed')
  order by next_due_at
  limit p_limit
$$;

-- Trừ 1 lượt nói; trả về số lượt còn lại, hoặc -1 nếu hết
create or replace function public.consume_turn(p_user uuid, p_daily_limit int)
returns int language plpgsql security definer set search_path = public as $$
declare v_day date := (now() at time zone 'Asia/Ho_Chi_Minh')::date; v_left int;
begin
  insert into daily_usage (user_id, day, turns) values (p_user, v_day, 0)
  on conflict do nothing;
  update daily_usage set turns = turns + 1
  where user_id = p_user and day = v_day and turns < p_daily_limit + bonus
  returning p_daily_limit + bonus - turns into v_left;
  return coalesce(v_left, -1);
end $$;

-- Số liệu cho màn Tiến độ
create or replace view public.error_stats with (security_invoker = true) as
select user_id,
  count(*) filter (where status = 'closed')    as closed,
  count(*) filter (where status = 'recalling') as recalling,
  count(*) filter (where status = 'repairing') as repairing,
  count(*)                                     as total
from public.learner_errors group by user_id;

-- Các hàm ghi chỉ cho Edge Function (service_role) gọi
revoke all on function public.catch_error(uuid,text,text,text,text,text,text,bigint) from public, anon, authenticated;
revoke all on function public.apply_error_event(uuid,uuid,text,bigint) from public, anon, authenticated;
revoke all on function public.due_recalls(uuid,int) from public, anon, authenticated;
revoke all on function public.consume_turn(uuid,int) from public, anon, authenticated;
grant execute on function public.catch_error(uuid,text,text,text,text,text,text,bigint) to service_role;
grant execute on function public.apply_error_event(uuid,uuid,text,bigint) to service_role;
grant execute on function public.due_recalls(uuid,int) to service_role;
grant execute on function public.consume_turn(uuid,int) to service_role;

-- ───────────── RLS: người dùng chỉ đọc dữ liệu của mình ─────────────
alter table public.profiles        enable row level security;
alter table public.band_snapshots  enable row level security;
alter table public.study_plans     enable row level security;
alter table public.topics          enable row level security;
alter table public.sessions        enable row level security;
alter table public.turns           enable row level security;
alter table public.daily_usage     enable row level security;
alter table public.error_codes     enable row level security;
alter table public.learner_errors  enable row level security;
alter table public.error_events    enable row level security;
alter table public.vocab_items     enable row level security;

create policy own_profile_select on public.profiles for select to authenticated using (id = auth.uid());
create policy own_profile_upsert on public.profiles for insert to authenticated with check (id = auth.uid() and plan = 'free');
-- Không cho tự đổi cột plan: dùng trigger chặn
create policy own_profile_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.lock_plan_column() returns trigger language plpgsql as $$
begin
  if new.plan is distinct from old.plan and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'plan can only be changed by the server';
  end if;
  return new;
end $$;
create trigger profiles_lock_plan before update on public.profiles
  for each row execute function public.lock_plan_column();

create policy read_own on public.band_snapshots for select to authenticated using (user_id = auth.uid());
-- người dùng tự nhập điểm thi thật
create policy insert_real_score on public.band_snapshots for insert to authenticated
  with check (user_id = auth.uid() and source = 'real_exam');
create policy read_own on public.study_plans    for select to authenticated using (user_id = auth.uid());
create policy read_own on public.sessions       for select to authenticated using (user_id = auth.uid());
create policy read_own on public.turns          for select to authenticated using (user_id = auth.uid());
create policy read_own on public.daily_usage    for select to authenticated using (user_id = auth.uid());
create policy read_own on public.learner_errors for select to authenticated using (user_id = auth.uid());
create policy read_own on public.error_events   for select to authenticated using (user_id = auth.uid());
create policy own_vocab on public.vocab_items   for all    to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy read_all on public.topics         for select to authenticated using (true);
create policy read_all on public.error_codes    for select to authenticated using (true);
