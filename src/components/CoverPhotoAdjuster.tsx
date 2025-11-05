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
  const [svgPath, setSvgPath] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  // Load city geometry
  useEffect(() => {
    const loadGeometry = async () => {
      const geoData = await findMunicipalityGeometry(cityName, stateName);
      if (geoData) {
        setGeometry(geoData);
        
        // Convert geometry coordinates to SVG path
        const coords = geoData.geometry.type === 'Polygon' 
          ? geoData.geometry.coordinates[0]
          : geoData.geometry.coordinates[0][0];
        
        if (coords && coords.length > 0) {
          // Calculate bounds for normalization
          const lngs = coords.map(c => c[0]);
          const lats = coords.map(c => c[1]);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const lngSpan = maxLng - minLng;
          const latSpan = maxLat - minLat;
          
          // Create SVG path with normalized coordinates (0-100)
          const pathData = coords.map((coord, i) => {
            const x = ((coord[0] - minLng) / lngSpan) * 100;
            const y = ((maxLat - coord[1]) / latSpan) * 100; // Invert Y axis
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ') + ' Z';
          
          setSvgPath(pathData);
        }
      }
    };
    
    loadGeometry();
  }, [cityName, stateName]);

  // Update position when initialPosition changes
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
        className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border-2 border-border cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {svgPath ? (
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <clipPath id="city-clip">
                <path d={svgPath} />
              </clipPath>
            </defs>
            
            {/* Photo clipped to city shape */}
            <g clipPath="url(#city-clip)">
              <image
                href={photoUrl}
                x={position.x * 100 - 50 * position.scale}
                y={position.y * 100 - 50 * position.scale}
                width={100 * position.scale}
                height={100 * position.scale}
                preserveAspectRatio="xMidYMid slice"
              />
            </g>
            
            {/* City outline */}
            <path
              d={svgPath}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary"
            />
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