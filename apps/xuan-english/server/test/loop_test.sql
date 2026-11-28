-- Kiểm tra vòng sửa lỗi: bắt lỗi → sửa ngay x2 → gài lại 3 lần → đóng → mắc lại thì mở lại
\set ON_ERROR_STOP on
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000001','a@test');

do $$
declare
  u uuid := '00000000-0000-0000-0000-000000000001';
  eid uuid; e public.learner_errors;
begin
  eid := public.catch_error(u,'VN-07','GRA','My city change a lot','My city has changed a lot','It''s changed dramatically',null);
  select * into e from learner_errors where learner_errors.id = eid;
  assert e.status = 'repairing' and e.next_due_at is null, 'new error should be repairing';

  e := public.apply_error_event(u,eid,'repair_ok');
  assert e.status = 'repairing', 'one repair is not enough';
  e := public.apply_error_event(u,eid,'repair_ok');
  assert e.status = 'recalling' and e.stage = 0, 'two repairs → recalling';
  assert e.next_due_at between now() + interval '23 hours' and now() + interval '25 hours', 'first recall after 1 day';

  e := public.apply_error_event(u,eid,'recall_ok');
  assert e.streak = 1 and e.stage = 1 and e.next_due_at > now() + interval '2 days', 'next recall after 3 days';
  e := public.apply_error_event(u,eid,'recall_fail');
  assert e.streak = 0 and e.stage = 0 and e.occurrences = 2, 'fail resets to day 1';

  e := public.apply_error_event(u,eid,'recall_ok');
  e := public.apply_error_event(u,eid,'recall_ok');
  e := public.apply_error_event(u,eid,'recall_ok');
  assert e.status = 'closed' and e.closed_at is not null, '3 correct in a row → closed';
  assert e.next_due_at > now() + interval '13 days', 'retention check at 14 days';

  -- mắc lại lỗi đã đóng → quay về Sửa ngay
  perform public.catch_error(u,'VN-07','GRA','It change','It has changed',null,null);
  select * into e from learner_errors where learner_errors.id = eid;
  assert e.status = 'repairing' and e.repair_ok = 0 and e.occurrences = 3, 'relapse reopens';

  -- lỗi không có mã: gộp theo câu đúng đã chuẩn hoá
  perform public.catch_error(u,null,'LR','do a decision','Make a  decision',null,null);
  perform public.catch_error(u,null,'LR','did a decision','make a decision',null,null);
  assert (select count(*) from learner_errors where code is null) = 1, 'dedupe by right_text';

  -- quota 2 lượt/ngày
  assert public.consume_turn(u,2) = 1;
  assert public.consume_turn(u,2) = 0;
  assert public.consume_turn(u,2) = -1, 'quota exhausted';
  update daily_usage set bonus = 1 where user_id = u;
  assert public.consume_turn(u,2) = 0, 'bonus turn works';

  assert (select count(*) from error_codes) >= 20, 'seed loaded';
  raise notice 'ALL LOOP TESTS PASSED';
end $$;

-- RLS: người khác không thấy lỗi của user 1; không tự nâng gói
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000002','b@test');
grant usage on schema public to authenticated;
grant select, insert, update on all tables in schema public to authenticated;
insert into profiles (id) values ('00000000-0000-0000-0000-000000000001');
set role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002', false); end $$;
do $$ begin assert (select count(*) from learner_errors) = 0, 'RLS hides other users'; end $$;
do $$ begin perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001', false); end $$;
do $$ begin assert (select count(*) from learner_errors) = 2, 'owner sees own errors'; end $$;
do $$ begin
  begin
    update profiles set plan = 'pro';
    raise exception 'should not reach';
  exception when others then
    assert sqlerrm like 'plan can only be changed%', sqlerrm;
  end;
  raise notice 'RLS TESTS PASSED';
end $$;
