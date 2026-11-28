-- Giọng đọc AI (voice-tts), phần 2: nạp danh sách đoạn từ ai-jobs.json, manifest kèm thứ tự ưu tiên.
-- Phần 1 (bảng voice.jobs, voice.state, kho 'voice', cron 'voice-tts') đã áp dụng ở migration voice_tts_jobs.
insert into voice.state values ('seeded_at', to_jsonb('2000-01-01'::timestamptz)) on conflict do nothing;

-- Đoạn đã xong và nội dung không đổi thì giữ; đổi nội dung thì đọc lại; đoạn không còn trong danh sách thì bỏ.
create or replace function public.nc_voice_seed(p_app text, p_jobs jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_up int; v_del int;
begin
  insert into voice.jobs (id, app, item_id, part, parts, kind, item_hash, script, cue_ids, priority)
  select j->>'id', p_app, j->>'item', (j->>'part')::int, (j->>'parts')::int, j->>'kind', j->>'hash', j->>'script',
         array(select jsonb_array_elements_text(j->'cues')::int), (j->>'priority')::int
    from jsonb_array_elements(p_jobs) j
  on conflict (id) do update set
     status = case when voice.jobs.item_hash = excluded.item_hash and voice.jobs.script = excluded.script
                   then voice.jobs.status else 'pending' end,
     tries  = case when voice.jobs.item_hash = excluded.item_hash and voice.jobs.script = excluded.script
                   then voice.jobs.tries else 0 end,
     item_hash = excluded.item_hash, script = excluded.script, cue_ids = excluded.cue_ids,
     parts = excluded.parts, kind = excluded.kind, priority = excluded.priority, updated_at = now();
  get diagnostics v_up = row_count;
  delete from voice.jobs where app = p_app and id not in (select j->>'id' from jsonb_array_elements(p_jobs) j);
  get diagnostics v_del = row_count;
  update voice.state set value = to_jsonb(now()) where key = 'seeded_at';
  return jsonb_build_object('upserted', v_up, 'deleted', v_del);
end $$;

create or replace function public.nc_voice_seed_due()
returns boolean language sql stable security definer set search_path = '' as $$
  select (value #>> '{}')::timestamptz < now() - interval '6 hours' from voice.state where key = 'seeded_at';
$$;

create or replace function public.nc_voice_manifest(p_app text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'updated', now(),
    'total', (select count(*) from voice.jobs where app = p_app),
    'done',  (select count(*) from voice.jobs where app = p_app and status = 'done'),
    'failed',(select count(*) from voice.jobs where app = p_app and status = 'failed'),
    'paused_until', (select value from voice.state where key = 'paused_until'),
    'jobs', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'item', item_id, 'part', part, 'parts', parts,
                       'hash', item_hash, 'cues', cue_ids, 'file', audio_path, 'bytes', bytes, 'ms', ms,
                       'model', model, 'voice', voice_name, 'priority', priority) order by item_id, part)
                      from voice.jobs where app = p_app and status = 'done'), '[]'::jsonb));
$$;

revoke all on function public.nc_voice_seed(text, jsonb), public.nc_voice_seed_due() from public, anon, authenticated;
grant execute on function public.nc_voice_seed(text, jsonb), public.nc_voice_seed_due() to service_role;

-- Cron gọi khi có đoạn đến lượt, hoặc khi tới hạn nạp lại danh sách.
select cron.alter_job((select jobid from cron.job where jobname = 'voice-tts'), command := $cmd$
  select private.kick('voice-tts')
   where ((select (value #>> '{}')::timestamptz from voice.state where key = 'paused_until') <= now()
          and exists (select 1 from voice.jobs where status in ('pending','running') and next_at <= now()))
      or (select (value #>> '{}')::timestamptz from voice.state where key = 'seeded_at') < now() - interval '6 hours'
$cmd$);
