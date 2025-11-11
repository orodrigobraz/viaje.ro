-- Adicionar campos de data à tabela city_reviews
ALTER TABLE public.city_reviews
ADD COLUMN visit_start_date date,
ADD COLUMN visit_end_date date;

-- Criar edge function para deletar conta de usuário
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Obter o ID do usuário atual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Deletar dados relacionados ao usuário
  -- As políticas RLS e foreign keys com ON DELETE CASCADE cuidarão do resto
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;