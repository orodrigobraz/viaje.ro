import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Globe, Building, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { City, countryData, getStateArea } from '@/data/mockData';
import ReactECharts from 'echarts-for-react';

interface DynamicStatisticsProps {
  cities: City[];
}

export const DynamicStatistics = ({ cities }: DynamicStatisticsProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calcular área total
  const totalArea = cities.reduce((sum, city) => sum + city.properties.area, 0);
  
  // Calcular porcentagem do Brasil
  const brazilPercentage = totalArea > 0 ? (totalArea / countryData.area_territorial_km2) * 100 : 0;

  // Agrupar cidades por estado e calcular estatísticas
  const stateStats = cities.reduce((acc, city) => {
    const state = city.properties.estado;
    if (!acc[state]) {
      acc[state] = {
        totalArea: 0,
        cities: []
      };
    }
    acc[state].totalArea += city.properties.area;
    acc[state].cities.push(city.properties.nome);
    return acc;
  }, {} as Record<string, { totalArea: number; cities: string[] }>);

  // Calcular porcentagens por estado
  const statePercentages = Object.entries(stateStats).map(([state, data]) => {
    const stateArea = getStateArea(state);
    const percentage = stateArea > 0 ? (data.totalArea / stateArea) * 100 : 0;
    return {
      state,
      totalArea: data.totalArea,
      percentage,
      citiesCount: data.cities.length,
      cities: data.cities
    };
  }).sort((a, b) => b.percentage - a.percentage);

  // Configuração do gráfico de pizza
  const getChartOption = () => {
    if (statePercentages.length === 0) return null;

    const data = statePercentages.map(({ state, totalArea }) => ({
      name: state,
      value: totalArea
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const percentage = ((params.value / totalArea) * 100).toFixed(2);
          return `${params.name}<br/>Área: ${params.value.toLocaleString('pt-BR')} km²<br/>Proporção: ${percentage}%`;
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: {
          fontSize: 12
        }
      },
      series: [
        {
          name: 'Estados Visitados',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['65%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data,
          color: ['#ff7800', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899']
        }
      ]
    };
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        className="w-full border-border hover:bg-accent"
      >
        <Eye className="h-4 w-4 mr-2" />
        Mostrar Estatísticas
      </Button>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Estatísticas
          </CardTitle>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Estatísticas gerais */}
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Área Total Visitada</p>
                <p className="font-semibold text-secondary-foreground">
                  {totalArea.toLocaleString('pt-BR')} km²
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-orange/10 rounded-md border border-orange/20">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-orange" />
              <div>
                <p className="text-sm text-muted-foreground">% do Brasil</p>
                <p className="font-semibold text-orange">
                  {brazilPercentage.toFixed(4)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Pizza */}
        {statePercentages.length > 0 && getChartOption() && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Distribuição por Estado</h4>
            <ReactECharts 
              option={getChartOption()} 
              style={{ height: '300px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        )}

        {/* Estatísticas por estado */}
        {statePercentages.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between border-border">
                <span className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Estatísticas por Estado ({statePercentages.length})
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-2 mt-3">
              {statePercentages.map(({ state, totalArea, percentage, citiesCount, cities }) => (
                <div key={state} className="p-3 bg-teal/10 rounded-md border border-teal/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-teal">{state}</h4>
                    <span className="text-sm font-semibold text-teal">
                      {percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{totalArea.toLocaleString('pt-BR')} km² • {citiesCount} cidade{citiesCount > 1 ? 's' : ''}</p>
                    <p className="truncate" title={cities.join(', ')}>
                      {cities.slice(0, 3).join(', ')}{cities.length > 3 ? ` +${cities.length - 3} mais` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {cities.length > 0 && (
          <div className="mt-4 p-3 bg-info/10 rounded-md border border-info/20">
            <p className="text-xs text-info-foreground">
              <strong>Nota:</strong> As porcentagens são calculadas com base nas áreas
              oficiais dos estados e do Brasil ({countryData.area_territorial_km2.toLocaleString('pt-BR')} km²).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};