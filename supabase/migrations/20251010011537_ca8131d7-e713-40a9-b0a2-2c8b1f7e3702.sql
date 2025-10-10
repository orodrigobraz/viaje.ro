-- Adicionar coluna para marcar foto de capa
ALTER TABLE city_review_photos
ADD COLUMN is_cover BOOLEAN DEFAULT false;

-- Adicionar colunas para posicionamento da foto de capa no mapa
ALTER TABLE city_reviews
ADD COLUMN cover_photo_position_x NUMERIC DEFAULT 0.5,
ADD COLUMN cover_photo_position_y NUMERIC DEFAULT 0.5,
ADD COLUMN cover_photo_scale NUMERIC DEFAULT 1.0;

-- Criar índice para busca rápida de fotos de capa
CREATE INDEX idx_city_review_photos_cover ON city_review_photos(review_id, is_cover) WHERE is_cover = true;

-- Adicionar constraint para garantir apenas uma foto de capa por review
CREATE UNIQUE INDEX idx_one_cover_per_review ON city_review_photos(review_id) WHERE is_cover = true;

-- Comentários para documentação
COMMENT ON COLUMN city_review_photos.is_cover IS 'Indica se esta foto é a capa que aparece no mapa';
COMMENT ON COLUMN city_reviews.cover_photo_position_x IS 'Posição X da foto de capa (0-1, relativo ao contorno)';
COMMENT ON COLUMN city_reviews.cover_photo_position_y IS 'Posição Y da foto de capa (0-1, relativo ao contorno)';
COMMENT ON COLUMN city_reviews.cover_photo_scale IS 'Escala da foto de capa para ajuste no mapa';