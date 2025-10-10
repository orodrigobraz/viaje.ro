import { useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

interface CoverPhotoAdjusterProps {
  photoUrl: string;
  initialPosition?: { x: number; y: number; scale: number };
  onPositionChange: (position: { x: number; y: number; scale: number }) => void;
}

export const CoverPhotoAdjuster = ({
  photoUrl,
  initialPosition = { x: 0.5, y: 0.5, scale: 1.0 },
  onPositionChange,
}: CoverPhotoAdjusterProps) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    onPositionChange(position);
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startPosRef.current = {
      x: e.clientX - position.x * 200,
      y: e.clientY - position.y * 200,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - startPosRef.current.x) / 200));
    const y = Math.max(0, Math.min(1, (e.clientY - startPosRef.current.y) / 200));

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
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform"
          style={{
            backgroundImage: `url(${photoUrl})`,
            transform: `translate(${(position.x - 0.5) * 100}%, ${(position.y - 0.5) * 100}%) scale(${position.scale})`,
          }}
        />
        
        {/* Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 border-2 border-primary rounded-full opacity-50" />
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