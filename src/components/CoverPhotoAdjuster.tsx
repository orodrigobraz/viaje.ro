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
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

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
          
          // Calcular proporção correta da geometria (com limites para evitar extremos)
          const calculatedAspectRatio = lngSpan / latSpan;
          // Limitar entre 0.5 e 3.0 para manter o container em tamanho razoável
          const clampedAspectRatio = Math.max(0.5, Math.min(3.0, calculatedAspectRatio));
          setAspectRatio(clampedAspectRatio);
          
          // Processar todos os polígonos (para MultiPolygon, inclui continente e ilhas)
          const paths: string[] = [];
          
          if (geoData.geometry.type === 'Polygon') {
            // Processar o polígono externo
            const polygonCoords = geoData.geometry.coordinates as number[][][];
            const pathData = polygonCoords[0].map((coord, i) => {
              const x = ((coord[0] - minLng) / lngSpan) * 100;
              const y = ((maxLat - coord[1]) / latSpan) * 100;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ') + ' Z';
            paths.push(pathData);
            
            // Processar buracos (holes) se existirem
            for (let i = 1; i < polygonCoords.length; i++) {
              const holePath = polygonCoords[i].map((coord, j) => {
                const x = ((coord[0] - minLng) / lngSpan) * 100;
                const y = ((maxLat - coord[1]) / latSpan) * 100;
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
                const x = ((coord[0] - minLng) / lngSpan) * 100;
                const y = ((maxLat - coord[1]) / latSpan) * 100;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ') + ' Z';
              paths.push(pathData);
              
              // Buracos (holes) se existirem
              for (let i = 1; i < polygon.length; i++) {
                const holePath = polygon[i].map((coord, j) => {
                  const x = ((coord[0] - minLng) / lngSpan) * 100;
                  const y = ((maxLat - coord[1]) / latSpan) * 100;
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

  // Carregar dimensões reais da imagem
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const imgAspectRatio = img.width / img.height;
      setImageAspectRatio(imgAspectRatio);
    };
    img.src = photoUrl;
  }, [photoUrl]);

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

    const relativeX = (e.clientX - rect.left) / rect.width;
    const relativeY = (e.clientY - rect.top) / rect.height;
    startPosRef.current = {
      x: relativeX - position.x,
      y: relativeY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;
    const relativeY = (e.clientY - rect.top) / rect.height;
    
    const x = Math.max(0, Math.min(1, relativeX - startPosRef.current.x));
    const y = Math.max(0, Math.min(1, relativeY - startPosRef.current.y));

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
        className="relative w-full bg-muted rounded-lg overflow-hidden border-2 border-border cursor-move"
        style={{ aspectRatio: aspectRatio }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {svgPaths.length > 0 ? (
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <clipPath id="city-clip">
                {svgPaths.map((path, index) => (
                  <path key={index} d={path} />
                ))}
              </clipPath>
            </defs>
            
            {/* Foto recortada no formato da cidade */}
            <g clipPath="url(#city-clip)">
              {(() => {
                // Calcular dimensões mantendo proporção real da imagem
                const containerAspectRatio = aspectRatio;
                let imgWidth: number;
                let imgHeight: number;
                
                if (imageAspectRatio > containerAspectRatio) {
                  // Imagem é mais larga - ajustar pela largura
                  imgWidth = 100 * position.scale;
                  imgHeight = imgWidth / imageAspectRatio;
                } else {
                  // Imagem é mais alta - ajustar pela altura
                  imgHeight = 100 * position.scale;
                  imgWidth = imgHeight * imageAspectRatio;
                }
                
                const imgX = position.x * 100 - (imgWidth / 2);
                const imgY = position.y * 100 - (imgHeight / 2);
                
                return (
                  <image
                    href={photoUrl}
                    x={imgX}
                    y={imgY}
                    width={imgWidth}
                    height={imgHeight}
                    preserveAspectRatio="none"
                  />
                );
              })()}
            </g>
            
            {/* Contorno da cidade (todos os polígonos) */}
            {svgPaths.map((path, index) => (
              <path
                key={index}
                d={path}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-primary"
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
          max={3}
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