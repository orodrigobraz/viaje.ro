import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Trash2 } from 'lucide-react';

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
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Cidades Visitadas ({cities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {cities.map((city) => (
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};