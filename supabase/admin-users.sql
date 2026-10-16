-- ═════════════════════════════════════════════════════════════════════════
-- Step 2 · create the admin logins for /admin
-- ═════════════════════════════════════════════════════════════════════════
-- Run AFTER setup.sql, in a separate SQL Editor query.
--
-- 1. Replace both REPLACE_ME values with NEW passwords (12+ characters).
--    Do not reuse the old ones: they were committed to this public repo.
-- 2. Run. Passwords are bcrypt-hashed inside the database; only the hash
--    is stored.
-- 3. Do NOT commit this file back with real passwords in it.
--
-- Re-running with a new password resets that admin's password.
-- ═════════════════════════════════════════════════════════════════════════

do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('ahmedgbril4050@gmail.com', 'REPLACE_ME'),
      ('lowmoch@gmail.com',        'REPLACE_ME')
    ) as v(email, pw)
  loop
    if r.pw = 'REPLACE_ME' or length(r.pw) < 12 then
      raise exception 'Set a real password (12+ characters) for % before running.', r.email;
    end if;

    insert into public.admin_users (email, password)
    values (lower(r.email), extensions.crypt(r.pw, extensions.gen_salt('bf', 12)))
    on conflict (email) do update set password = excluded.password;
  end loop;
end $$;

-- Any session issued under an old password stops working.
delete from public.admin_sessions;
