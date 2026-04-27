-- RPC para incrementar uso atomicamente (executa como service role via webhook/plan-gate)
create or replace function increment_ai_chat(p_owner_user_id uuid, p_period text)
returns void language plpgsql security definer as $$
begin
  insert into usage (owner_user_id, period, ai_chats_used, pdf_imports_used)
  values (p_owner_user_id, p_period, 1, 0)
  on conflict (owner_user_id, period)
  do update set ai_chats_used = usage.ai_chats_used + 1, updated_at = now();
end;
$$;

create or replace function increment_pdf_import(p_owner_user_id uuid, p_period text)
returns void language plpgsql security definer as $$
begin
  insert into usage (owner_user_id, period, ai_chats_used, pdf_imports_used)
  values (p_owner_user_id, p_period, 0, 1)
  on conflict (owner_user_id, period)
  do update set pdf_imports_used = usage.pdf_imports_used + 1, updated_at = now();
end;
$$;
