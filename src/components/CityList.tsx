import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface City {
  properties: {
    nome: string;
    area: number;
    estado: string;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface CityListProps {
  cities: City[];
  onRemoveCity: (cityName: string) => void;
}

export const CityList = ({ cities, onRemoveCity }: CityListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredCities = cities.filter(city =>
    city.properties.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.properties.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (cities.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Cidades Visitadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhuma cidade adicionada ainda.
            <br />
            Use o campo de busca para adicionar cidades.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Cidades Visitadas ({cities.length})
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <div 
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{ 
          maxHeight: isExpanded ? '500px' : '0',
          opacity: isExpanded ? 1 : 0
        }}
      >
        <CardContent>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar cidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredCities.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma cidade encontrada.
                </p>
              ) : (
                filteredCities.map((city) => (
                  <div
                    key={city.properties.nome}
                    className="flex items-center justify-between p-3 bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-secondary-foreground">
                        {city.properties.nome}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {city.properties.estado} • {city.properties.area.toLocaleString('pt-BR')} km²
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveCity(city.properties.nome)}
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};