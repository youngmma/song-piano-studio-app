-- =====================================================================
-- Song Piano Studio Manager — Supabase schema (MVP)
-- 테이블: students, lesson_slots, attendance, makeup_credits, portal_tokens
-- 실행 위치: Supabase Dashboard > SQL Editor > New query 에 전체 붙여넣기
-- =====================================================================

-- 1) 원생 ---------------------------------------------------------------
create table if not exists students (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 40),
  grade_level text check (char_length(grade_level) <= 30),   -- 학년/레벨 (예: "초3", "Level 4")
  parent_name text check (char_length(parent_name) <= 40),   -- 학부모 이름
  contact_phone text check (char_length(contact_phone) <= 20), -- 학부모 연락처
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- 2) 주간 수업 시간표 ----------------------------------------------------
create table if not exists lesson_slots (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6), -- 0=일요일
  start_time  time not null,
  duration_min smallint not null default 30 check (duration_min > 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- 3) 출석 기록 (원생+수업일 유일) -----------------------------------------
create table if not exists attendance (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(id) on delete cascade,
  lesson_date date not null,
  status      text not null check (status in ('present','absent','makeup')),
  note        text check (char_length(note) <= 200),
  created_at  timestamptz not null default now(),
  unique (student_id, lesson_date)
);

-- 4) 보강 크레딧 장부 (트리거가 자동 기록, 앱에서 직접 쓰지 않음) ---------
create table if not exists makeup_credits (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  delta         smallint not null check (delta in (1, -1)),
  reason        text not null check (reason in ('absence','makeup_lesson','correction')),
  attendance_id uuid references attendance(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- 5) 학부모 포털 토큰 ------------------------------------------------------
create table if not exists portal_tokens (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(id) on delete cascade,
  token       text not null unique check (char_length(token) >= 32),
  revoked     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- 보강 크레딧 자동 장부 트리거
--   결석 기록 → +1, 보강 수업 기록 → -1, 상태 정정 시 자동 역분개
-- =====================================================================
create or replace function apply_makeup_credit()
returns trigger language plpgsql as $$
begin
  -- INSERT: 새 출석 기록
  if tg_op = 'INSERT' then
    if new.status = 'absent' then
      insert into makeup_credits (student_id, delta, reason, attendance_id)
      values (new.student_id, 1, 'absence', new.id);
    elsif new.status = 'makeup' then
      insert into makeup_credits (student_id, delta, reason, attendance_id)
      values (new.student_id, -1, 'makeup_lesson', new.id);
    end if;
    return new;
  end if;
  -- UPDATE: 상태 변경 시에만 장부 조정
  -- UPDATE: 상태 변경 시 장부 조정.
  -- 업계 표준: 보강 수업을 결석하면 크레딧은 반환되지 않고 신규 발급도 없음
  -- ("Missed make up lessons will NOT be made up").
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    if old.status = 'absent' and new.status = 'present' then
      insert into makeup_credits (student_id, delta, reason, attendance_id)
      values (new.student_id, -1, 'correction', new.id);
    elsif old.status = 'absent' and new.status = 'makeup' then
      insert into makeup_credits (student_id, delta, reason, attendance_id)
      values (new.student_id, -1, 'correction', new.id);
      insert into makeup_credits (student_id, delta, reason, attendance_id)
      values (new.student_id, -1, 'makeup_lesson', new.id);
    elsif old.status = 'makeup' and new.status = 'present' then
      insert into makeup_credits (student_id, delta, reason, attendance_id)
      values (new.student_id, 1, 'correction', new.id);
    elsif old.status = 'makeup' and new.status = 'absent' then
      -- 보강 수업 결석: 사용된 크레딧 반환 없음, 신규 크레딧 없음 (장부 변동 없음)
      null;
    elsif old.status = 'present' and new.status = 'absent' then
      insert into makeup_credits (student_id, delta, reason, attendance_id)
      values (new.student_id, 1, 'absence', new.id);
    elsif old.status = 'present' and new.status = 'makeup' then
      insert into makeup_credits (student_id, delta, reason, attendance_id)
      values (new.student_id, -1, 'makeup_lesson', new.id);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_apply_makeup_credit on attendance;
create trigger trg_apply_makeup_credit
  after insert or update of status on attendance
  for each row execute function apply_makeup_credit();

-- =====================================================================
-- RLS: 원장은 Supabase Auth 로그인(authenticated) 후 전체 접근.
-- 익명(anon)은 테이블 직접 접근 불가. 학부모 포털은 아래
-- SECURITY DEFINER 함수로 토큰 검증 후 해당 원생 데이터만 반환.
-- =====================================================================
alter table students       enable row level security;
alter table lesson_slots   enable row level security;
alter table attendance     enable row level security;
alter table makeup_credits enable row level security;
alter table portal_tokens  enable row level security;

-- 원장(로그인 사용자): 5개 테이블 전체 허용
do $$
declare t text;
begin
  foreach t in array array['students','lesson_slots','attendance','makeup_credits','portal_tokens'] loop
    execute format('drop policy if exists teacher_full on %I', t);
    execute format(
      'create policy teacher_full on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- 학부모 포털 조회 함수 (토큰 소유자만, 본인 자녀 데이터만)
create or replace function portal_view(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s_id uuid;
  result jsonb;
begin
  if p_token is null or char_length(p_token) < 32 then
    return jsonb_build_object('ok', false);
  end if;
  select student_id into s_id
    from portal_tokens
   where token = p_token and revoked = false
   limit 1;
  if s_id is null then
    return jsonb_build_object('ok', false);
  end if;
  select jsonb_build_object(
    'ok', true,
    'student', jsonb_build_object('name', s.name, 'grade_level', s.grade_level),
    'balance', coalesce((select sum(delta)::int from makeup_credits where student_id = s_id), 0),
    'attendance', coalesce((
      select jsonb_agg(jsonb_build_object('date', lesson_date, 'status', status)
                       order by lesson_date desc)
        from (select lesson_date, status from attendance
               where student_id = s_id order by lesson_date desc limit 30) t
    ), '[]'::jsonb)
  ) into result
  from students s where s.id = s_id and s.active = true;
  if result is null then
    return jsonb_build_object('ok', false);
  end if;
  return result;
end $$;

revoke all on function portal_view(text) from public;
grant execute on function portal_view(text) to anon, authenticated;

-- 잔액 조회 헬퍼 (원장 화면용, 로그인 사용자만 RLS 통과)
create or replace function credit_balance(p_student uuid)
returns int
language sql
security definer
set search_path = public
as $$ select coalesce(sum(delta)::int, 0) from makeup_credits where student_id = p_student $$;

revoke all on function credit_balance(uuid) from public;
grant execute on function credit_balance(uuid) to authenticated;
