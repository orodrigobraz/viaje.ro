import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, Trash2 } from 'lucide-react';
import { City } from '@/data/mockData';
import { useIsMobile } from '@/hooks/use-mobile';
import { WishlistMapView } from './WishlistMapView';

interface WishlistModalProps {
  cities: City[];
  onRemoveCity: (cityName: string) => void;
}

export const WishlistModal = ({ cities, onRemoveCity }: WishlistModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full mt-3 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border-purple-200 text-purple-700 shadow-md"
        >
          <Heart className="h-4 w-4 mr-2" />
          Lista de Desejos ({cities.length})
        </Button>
      </DialogTrigger>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-6xl max-h-[90vh]'} overflow-y-auto z-[9999] bg-background border border-border`}>
        <DialogHeader className="bg-background border-b border-border pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-purple-600" />
            Lista de Desejos - Lugares que quero visitar
          </DialogTitle>
        </DialogHeader>

        <div className={`grid ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-3'} gap-6 ${isMobile ? 'h-auto' : 'h-[70vh]'}`}>
          {/* Lista de cidades */}
          <div className={`${isMobile ? '' : 'lg:col-span-1'} space-y-4 overflow-y-auto`}>
            <div>
              <h3 className="text-lg font-semibold text-purple-700 mb-3">
                Destinos adicionados: ({cities.length})
              </h3>
              {cities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma cidade na lista de desejos</p>
                  <p className="text-sm">Adicione destinos que deseja visitar!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cities.map((city, index) => (
                    <div 
                      key={`${city.properties.nome}-${city.properties.estado}-${index}`}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-purple-800">
                          {city.properties.nome}
                        </h4>
                        <p className="text-sm text-purple-600">
                          {city.properties.estado} • {city.properties.area.toLocaleString('pt-BR')} km²
                        </p>
                      </div>
                      <Button
                        onClick={() => onRemoveCity(city.properties.nome)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Mapa */}
          <div className={`${isMobile ? '' : 'lg:col-span-2'} ${isMobile ? 'min-h-[400px]' : 'min-h-[500px] lg:h-full'}`}>
            <WishlistMapView cities={cities} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};