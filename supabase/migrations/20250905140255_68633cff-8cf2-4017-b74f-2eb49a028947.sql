-- Habilitar RLS na tabela municipios e criar políticas
ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos possam ler os dados dos municípios (dados públicos)
CREATE POLICY "Permitir leitura pública dos municípios" 
ON public.municipios 
FOR SELECT 
USING (true);