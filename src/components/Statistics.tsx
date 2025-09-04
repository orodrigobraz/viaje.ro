import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, MapPin, Globe, Building } from 'lucide-react';

interface City {
  properties: {
    nome: string;
    area: number;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface StatisticsProps {
  cities: City[];
}

import { statesData, countryData } from '@/data/mockData';

// Obter áreas dos dados reais
const MINAS_GERAIS_AREA = statesData.find(state => state.estado === "Minas Gerais")?.area_territorial_km2 || 586513.983;
const BRAZIL_AREA = countryData.area_territorial_km2;

export const Statistics = ({ cities }: StatisticsProps) => {
  const totalArea = cities.reduce((sum, city) => sum + city.properties.area, 0);
  const mgPercentage = totalArea > 0 ? (totalArea / MINAS_GERAIS_AREA) * 100 : 0;
  const brazilPercentage = totalArea > 0 ? (totalArea / BRAZIL_AREA) * 100 : 0;

  const stats = [
    {
      title: 'Área Total Visitada',
      value: totalArea.toLocaleString('pt-BR'),
      unit: 'km²',
      icon: MapPin,
      color: 'text-primary'
    },
    {
      title: 'Porcentagem de MG',
      value: mgPercentage.toFixed(2),
      unit: '%',
      icon: Building,
      color: 'text-success'
    },
    {
      title: 'Porcentagem do Brasil',
      value: brazilPercentage.toFixed(4),
      unit: '%',
      icon: Globe,
      color: 'text-orange'
    }
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Estatísticas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="flex items-center justify-between p-3 bg-secondary rounded-md"
            >
              <div className="flex items-center gap-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="font-semibold text-secondary-foreground">
                    {stat.value} {stat.unit}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {cities.length > 0 && (
            <div className="mt-4 p-3 bg-info/10 rounded-md border border-info/20">
              <p className="text-sm text-info-foreground">
                <strong>Nota:</strong> As porcentagens são calculadas com base nas áreas
                oficiais de Minas Gerais ({MINAS_GERAIS_AREA.toLocaleString('pt-BR')} km²) 
                e Brasil ({BRAZIL_AREA.toLocaleString('pt-BR')} km²).
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};