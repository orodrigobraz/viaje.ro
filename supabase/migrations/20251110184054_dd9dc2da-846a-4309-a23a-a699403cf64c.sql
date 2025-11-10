-- Criar bucket de avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Política para permitir que usuários vejam todos os avatares
CREATE POLICY "Avatares são visíveis publicamente"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Política para permitir que usuários façam upload de seus próprios avatares
CREATE POLICY "Usuários podem fazer upload de seus próprios avatares"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir que usuários atualizem seus próprios avatares
CREATE POLICY "Usuários podem atualizar seus próprios avatares"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir que usuários deletem seus próprios avatares
CREATE POLICY "Usuários podem deletar seus próprios avatares"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);