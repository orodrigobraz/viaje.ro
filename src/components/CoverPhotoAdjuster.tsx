import { useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';
import { findMunicipalityGeometry, GeoJSONFeature } from '@/utils/geoJsonLoader';

interface CoverPhotoAdjusterProps {
  photoUrl: string;
  cityName: string;
  stateName: string;
  initialPosition?: { x: number; y: number; scale: number };
  onPositionChange: (position: { x: number; y: number; scale: number }) => void;
}

export const CoverPhotoAdjuster = ({
  photoUrl,
  cityName,
  stateName,
  initialPosition = { x: 0.5, y: 0.5, scale: 1.0 },
  onPositionChange,
}: CoverPhotoAdjusterProps) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [geometry, setGeometry] = useState<GeoJSONFeature | null>(null);
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
  const [viewBox, setViewBox] = useState<string>('0 0 100 100');
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  // Carregar dimensões reais da imagem
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const imgAspectRatio = img.width / img.height;
      setImageAspectRatio(imgAspectRatio);
    };
    img.src = photoUrl;
  }, [photoUrl]);

  // Carregar geometria da cidade
  useEffect(() => {
    const loadGeometry = async () => {
      const geoData = await findMunicipalityGeometry(cityName, stateName);
      if (geoData) {
        setGeometry(geoData);
        
        // Coletar todas as coordenadas para calcular os limites globais
        let allCoords: number[][] = [];
        
        if (geoData.geometry.type === 'Polygon') {
          // Para Polygon, pegar todas as coordenadas do polígono externo
          const polygonCoords = geoData.geometry.coordinates as number[][][];
          allCoords = polygonCoords[0];
        } else if (geoData.geometry.type === 'MultiPolygon') {
          // Para MultiPolygon, coletar coordenadas de TODOS os polígonos (continente e ilhas)
          const multiPolygonCoords = geoData.geometry.coordinates as number[][][][];
          multiPolygonCoords.forEach((polygon: number[][][]) => {
            allCoords = allCoords.concat(polygon[0]);
          });
        }
        
        if (allCoords.length > 0) {
          // Calcular limites globais de toda a geometria
          const lngs = allCoords.map(c => c[0]);
          const lats = allCoords.map(c => c[1]);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const lngSpan = maxLng - minLng;
          const latSpan = maxLat - minLat;
          
          // Calcular proporção correta da geometria para manter proporções
          const calculatedAspectRatio = lngSpan / latSpan;
          // Limitar entre 0.5 e 3.0 para manter o container em tamanho razoável
          const clampedAspectRatio = Math.max(0.5, Math.min(3.0, calculatedAspectRatio));
          setAspectRatio(clampedAspectRatio);
          
          // Calcular viewBox baseado no aspect ratio
          const viewBoxWidth = 100;
          const viewBoxHeight = 100 / clampedAspectRatio;
          setViewBox(`0 0 ${viewBoxWidth} ${viewBoxHeight}`);
          
          // Fator de escala para "zoom out" - fazer o polígono aparecer menor (85% do tamanho)
          const zoomOutScale = 0.85;
          const paddingX = (1 - zoomOutScale) / 2;
          const paddingY = (1 - zoomOutScale) / 2;
          
          // Processar todos os polígonos (para MultiPolygon, inclui continente e ilhas)
          const paths: string[] = [];
          
          if (geoData.geometry.type === 'Polygon') {
            // Processar o polígono externo
            const polygonCoords = geoData.geometry.coordinates as number[][][];
            const pathData = polygonCoords[0].map((coord, i) => {
              // Normalizar para 0-1 primeiro
              const normalizedX = (coord[0] - minLng) / lngSpan;
              const normalizedY = (maxLat - coord[1]) / latSpan;
              // Aplicar escala e padding (zoom out) no sistema de coordenadas do viewBox
              const x = (paddingX + normalizedX * zoomOutScale) * viewBoxWidth;
              const y = (paddingY + normalizedY * zoomOutScale) * viewBoxHeight;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ') + ' Z';
            paths.push(pathData);
            
            // Processar buracos (holes) se existirem
            for (let i = 1; i < polygonCoords.length; i++) {
              const holePath = polygonCoords[i].map((coord, j) => {
                const normalizedX = (coord[0] - minLng) / lngSpan;
                const normalizedY = (maxLat - coord[1]) / latSpan;
                const x = (paddingX + normalizedX * zoomOutScale) * viewBoxWidth;
                const y = (paddingY + normalizedY * zoomOutScale) * viewBoxHeight;
                return `${j === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ') + ' Z';
              paths.push(holePath);
            }
          } else if (geoData.geometry.type === 'MultiPolygon') {
            // Processar TODOS os polígonos do MultiPolygon (continente e ilhas)
            const multiPolygonCoords = geoData.geometry.coordinates as number[][][][];
            multiPolygonCoords.forEach((polygon: number[][][]) => {
              // Polígono externo
              const pathData = polygon[0].map((coord, i) => {
                const normalizedX = (coord[0] - minLng) / lngSpan;
                const normalizedY = (maxLat - coord[1]) / latSpan;
                const x = (paddingX + normalizedX * zoomOutScale) * viewBoxWidth;
                const y = (paddingY + normalizedY * zoomOutScale) * viewBoxHeight;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ') + ' Z';
              paths.push(pathData);
              
              // Buracos se existirem
              for (let i = 1; i < polygon.length; i++) {
                const holePath = polygon[i].map((coord, j) => {
                  const normalizedX = (coord[0] - minLng) / lngSpan;
                  const normalizedY = (maxLat - coord[1]) / latSpan;
                  const x = (paddingX + normalizedX * zoomOutScale) * viewBoxWidth;
                  const y = (paddingY + normalizedY * zoomOutScale) * viewBoxHeight;
                  return `${j === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ') + ' Z';
                paths.push(holePath);
              }
            });
          }
          
          setSvgPaths(paths);
        }
      }
    };
    
    loadGeometry();
  }, [cityName, stateName]);


  // Atualizar posição quando initialPosition mudar
  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  useEffect(() => {
    onPositionChange(position);
  }, [position, onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    startPosRef.current = {
      x: e.clientX - position.x * rect.width,
      y: e.clientY - position.y * rect.height,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - startPosRef.current.x) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - startPosRef.current.y) / rect.height));
    setPosition((prev) => ({ ...prev, x, y }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (value: number[]) => {
    setPosition((prev) => ({ ...prev, scale: value[0] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Move className="h-4 w-4" />
        <span>Ajustar Foto de Capa</span>
      </div>
      
      {/* Preview Container */}
      <div
        ref={containerRef}
        className="relative w-full bg-white rounded-lg overflow-hidden border-2 border-border cursor-move"
        style={{ 
          aspectRatio: aspectRatio,
          maxHeight: '400px',
          maxWidth: '100%',
          height: 'auto'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {svgPaths.length > 0 ? (
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block', background: 'transparent' }}
          >
            <defs>
              <pattern
                id={`photo-pattern-${cityName.replace(/\s+/g, '-')}-${stateName.replace(/\s+/g, '-')}`}
                x="0"
                y="0"
                width="100%"
                height="100%"
                patternUnits="userSpaceOnUse"
                patternContentUnits="userSpaceOnUse"
              >
                {(() => {
                  const viewBoxWidth = 100;
                  const viewBoxHeight = 100 / aspectRatio;
                  // Calcular dimensões da imagem mantendo o aspect ratio real
                  // Usar um tamanho base e aplicar o aspect ratio da imagem
                  const baseSize = 100 * position.scale;
                  // Manter proporções: se aspect ratio > 1, imagem é mais larga
                  const imageWidth = baseSize * imageAspectRatio;
                  const imageHeight = baseSize;
                  const imageX = position.x * viewBoxWidth - (imageWidth / 2);
                  const imageY = position.y * viewBoxHeight - (imageHeight / 2);
                  
                  return (
                    <image
                      href={photoUrl}
                      x={imageX}
                      y={imageY}
                      width={imageWidth}
                      height={imageHeight}
                      preserveAspectRatio="none"
                    />
                  );
                })()}
              </pattern>
            </defs>
            
            {/* Foto preenchendo o polígono da cidade usando pattern */}
            {svgPaths.map((path, index) => (
              <path
                key={index}
                d={path}
                fill={`url(#photo-pattern-${cityName.replace(/\s+/g, '-')}-${stateName.replace(/\s+/g, '-')})`}
              />
            ))}
            
            {/* Contorno da cidade (todos os polígonos) */}
            {svgPaths.map((path, index) => (
              <path
                key={index}
                d={path}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-primary"
                style={{ pointerEvents: 'none' }}
              />
            ))}
          </svg>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Carregando geometria...
          </div>
        )}
        
        {/* Info overlay */}
        <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs pointer-events-none">
          <div className="font-semibold">{cityName}</div>
          <div className="text-muted-foreground">{stateName}</div>
        </div>
      </div>

      {/* Scale Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Zoom</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{position.scale.toFixed(1)}x</span>
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <Slider
          value={[position.scale]}
          onValueChange={handleScaleChange}
          min={0.5}
          max={10}
          step={0.1}
          className="w-full"
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Arraste a imagem para posicionar e use o controle de zoom para ajustar o tamanho
      </p>
    </div>
  );
};