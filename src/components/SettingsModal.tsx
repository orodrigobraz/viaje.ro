import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, Palette, RotateCcw, Heart } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { statesData } from '@/data/mockData';

const colorOptions = [
  '#ff7800', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899',
  '#6366f1', '#14b8a6', '#a855f7', '#22c55e', '#fb7185',
  '#fbbf24', '#f43f5e', '#3b82f6', '#64748b', '#737373'
];

export const SettingsModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { stateColors, wishlistColor, setStateColor, setWishlistColor, resetStateColors } = useSettings();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-border hover:bg-accent"
        >
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Configurações</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configurações do Mapa
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            {/* Cor da Lista de Desejos */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold">Cor da Lista de Desejos</h3>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-border"
                  style={{ backgroundColor: wishlistColor }}
                />
                <span className="font-medium">Contorno das Cidades na Lista de Desejos</span>
                
                <div className="flex gap-2 flex-wrap ml-auto">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                        wishlistColor === color 
                          ? 'border-foreground ring-2 ring-primary' 
                          : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setWishlistColor(color)}
                      title={`Selecionar cor ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Cores dos Estados */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold">Cores dos Estados</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetStateColors}
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Resetar
                </Button>
              </div>
              
              <div className="space-y-3">
                {statesData.map((estado) => (
                  <div key={estado.estado} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-border flex-shrink-0"
                        style={{ backgroundColor: stateColors[estado.estado] || '#ff7800' }}
                      />
                      <span className="font-medium truncate">{estado.estado}</span>
                    </div>
                    
                    <div className="flex gap-1 flex-wrap">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform flex-shrink-0 ${
                            stateColors[estado.estado] === color 
                              ? 'border-foreground ring-2 ring-primary' 
                              : 'border-border'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setStateColor(estado.estado, color)}
                          title={`Selecionar cor ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Dica:</strong> As cores selecionadas serão aplicadas aos contornos territoriais das cidades de cada estado no mapa principal. A cor da lista de desejos será aplicada especificamente no mapa da lista de desejos.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};