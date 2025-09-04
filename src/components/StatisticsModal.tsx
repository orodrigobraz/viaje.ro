import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart3, Globe, Building, Info, TrendingUp, TrendingDown, Users, GraduationCap, Heart, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { City, countryData, getStateArea, citiesData } from '@/data/mockData';
import ReactECharts from 'echarts-for-react';

interface StatisticsModalProps {
  cities: City[];
}

export const StatisticsModal = ({ cities }: StatisticsModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  // Component to render expandable city list
  const ExpandableCityList = ({ cities: cityList, bgColorClass, textColorClass, borderColorClass, iconColorClass, titleColorClass, subtitleColorClass, icon: Icon, value, unit }: {
    cities: any[];
    bgColorClass: string;
    textColorClass: string;
    borderColorClass: string;
    iconColorClass: string;
    titleColorClass: string;
    subtitleColorClass: string;
    icon: any;
    value: (city: any) => string;
    unit: string;
  }) => {
    const [expanded, setExpanded] = useState(false);
    const visibleCities = expanded ? cityList : cityList.slice(0, 1);
    const hasMore = cityList.length > 1;

    return (
      <div className={`p-4 ${bgColorClass} rounded-lg border ${borderColorClass}`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-4 w-4 ${iconColorClass}`} />
          <h4 className={`font-semibold ${titleColorClass}`}>
            {unit}
          </h4>
        </div>
        
        {visibleCities.map((city, index) => (
          <div key={index} className={index > 0 ? 'mt-2' : ''}>
            <p className={`text-lg font-bold ${textColorClass}`}>{city.nome}</p>
            <p className={`text-sm ${subtitleColorClass}`}>
              {city.estado} • {value(city)}
            </p>
          </div>
        ))}

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className={`mt-2 h-6 px-2 text-xs ${subtitleColorClass} hover:${bgColorClass}`}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Ver todas ({cityList.length})
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

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
      stateArea,
      percentage,
      citiesCount: data.cities.length,
      cities: data.cities
    };
  }).sort((a, b) => b.percentage - a.percentage);

  // Obter dados completos das cidades visitadas
  const visitedCitiesData = cities.map(city => {
    const cityData = citiesData.find(c => 
      c.nome.toLowerCase() === city.properties.nome.toLowerCase() && 
      c.estado.toLowerCase() === city.properties.estado.toLowerCase()
    );
    return cityData;
  }).filter(Boolean);

  // Calcular cidades extremas apenas se houver cidades
  const largestCityByArea = cities.length > 0 ? cities.reduce((prev, current) => 
    (prev.properties.area > current.properties.area) ? prev : current
  ) : null;
  
  const smallestCityByArea = cities.length > 0 ? cities.reduce((prev, current) => 
    (prev.properties.area < current.properties.area) ? prev : current
  ) : null;

  // Cidades extremas por população (2024)
  const largestCityByPopulation = visitedCitiesData.length > 0 ? visitedCitiesData.reduce((prev, current) => 
    (prev.populacao_estimada_censo_2024 > current.populacao_estimada_censo_2024) ? prev : current
  ) : null;
  
  const smallestCityByPopulation = visitedCitiesData.length > 0 ? visitedCitiesData.reduce((prev, current) => 
    (prev.populacao_estimada_censo_2024 < current.populacao_estimada_censo_2024) ? prev : current
  ) : null;

  // Cidades extremas por densidade demográfica
  const highestDensityCity = visitedCitiesData.length > 0 ? visitedCitiesData.reduce((prev, current) => 
    (prev.densidade_demografica_2022 > current.densidade_demografica_2022) ? prev : current
  ) : null;
  
  const lowestDensityCity = visitedCitiesData.length > 0 ? visitedCitiesData.reduce((prev, current) => 
    (prev.densidade_demografica_2022 < current.densidade_demografica_2022) ? prev : current
  ) : null;

  // Cidades com maior e menor escolarização
  const maxSchooling = visitedCitiesData.length > 0 ? Math.max(...visitedCitiesData.map(c => c.escolarizacao_6a14_2022)) : 0;
  const minSchooling = visitedCitiesData.length > 0 ? Math.min(...visitedCitiesData.map(c => c.escolarizacao_6a14_2022)) : 0;
  
  const highestSchoolingCities = visitedCitiesData.filter(c => c.escolarizacao_6a14_2022 === maxSchooling);
  const lowestSchoolingCities = visitedCitiesData.filter(c => c.escolarizacao_6a14_2022 === minSchooling);

  // Cidades com maior e menor IDHM
  const maxIDHM = visitedCitiesData.length > 0 ? Math.max(...visitedCitiesData.map(c => c.idhm_2010)) : 0;
  const minIDHM = visitedCitiesData.length > 0 ? Math.min(...visitedCitiesData.map(c => c.idhm_2010)) : 0;
  
  const highestIDHMCities = visitedCitiesData.filter(c => c.idhm_2010 === maxIDHM);
  const lowestIDHMCities = visitedCitiesData.filter(c => c.idhm_2010 === minIDHM);

  // Cidades com maior e menor PIB per capita
  const maxPIB = visitedCitiesData.length > 0 ? Math.max(...visitedCitiesData.map(c => c.pib_per_capita_2020)) : 0;
  const minPIB = visitedCitiesData.length > 0 ? Math.min(...visitedCitiesData.map(c => c.pib_per_capita_2020)) : 0;
  
  const highestPIBCities = visitedCitiesData.filter(c => c.pib_per_capita_2020 === maxPIB);
  const lowestPIBCities = visitedCitiesData.filter(c => c.pib_per_capita_2020 === minPIB);

  // Configuração do gráfico de pizza para distribuição por estado
  const getStateDistributionChart = () => {
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
          name: 'Distribuição por Estado',
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
          color: ['#ff7800', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#a855f7', '#22c55e', '#fb7185']
        }
      ]
    };
  };

  // Gráfico polar para porcentagem por estado
  const getStatePercentageChart = () => {
    if (statePercentages.length === 0) return null;

    return {
      title: {
        text: 'Cobertura Territorial por Estado',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>Cobertura: ${data.value.toFixed(2)}%`;
        }
      },
      polar: {
        radius: [30, '80%']
      },
      radiusAxis: {
        max: Math.max(...statePercentages.map(s => s.percentage)) * 1.1
      },
      angleAxis: {
        type: 'category',
        data: statePercentages.map(s => s.state),
        axisLabel: {
          fontSize: 10
        }
      },
      series: [{
        name: 'Cobertura',
        type: 'bar',
        data: statePercentages.map((s, index) => ({
          value: s.percentage,
          itemStyle: {
            color: ['#ff7800', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#a855f7', '#22c55e', '#fb7185'][index % 15]
          }
        })),
        coordinateSystem: 'polar'
      }]
    };
  };

  // Gráfico de área para população por cidade
  const getPopulationChart = () => {
    if (visitedCitiesData.length === 0) return null;

    const topCities = visitedCitiesData
      .sort((a, b) => b.populacao_estimada_censo_2024 - a.populacao_estimada_censo_2024)
      .slice(0, 10);

    return {
      title: {
        text: 'Top 10 Cidades por População (2024)',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>População: ${data.value.toLocaleString('pt-BR')} hab`;
        }
      },
      xAxis: {
        type: 'category',
        data: topCities.map(c => c.nome),
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: 'População',
        axisLabel: {
          formatter: (value: number) => `${(value / 1000).toFixed(0)}k`
        }
      },
      series: [{
        name: 'População',
        type: 'line',
        data: topCities.map(c => c.populacao_estimada_censo_2024),
        itemStyle: { color: '#8b5cf6' },
        lineStyle: { color: '#8b5cf6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(139, 92, 246, 0.3)'
            }, {
              offset: 1, color: 'rgba(139, 92, 246, 0.05)'
            }]
          }
        },
        smooth: true
      }]
    };
  };

  // Gráfico treemap para densidade demográfica
  const getDensityChart = () => {
    if (visitedCitiesData.length === 0) return null;

    const citiesWithDensity = visitedCitiesData
      .filter(c => c.densidade_demografica_2022 > 0)
      .sort((a, b) => b.densidade_demografica_2022 - a.densidade_demografica_2022)
      .slice(0, 12);

    const data = citiesWithDensity.map((city, index) => ({
      name: city.nome,
      value: city.densidade_demografica_2022,
      itemStyle: {
        color: ['#f59e0b', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#fff7ed', '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e', '#082f49'][index % 12]
      }
    }));

    return {
      title: {
        text: 'Top 12 Cidades por Densidade Demográfica',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}<br/>Densidade: ${params.value.toLocaleString('pt-BR')} hab/km²`;
        }
      },
      series: [{
        name: 'Densidade',
        type: 'treemap',
        data: data,
        roam: false,
        nodeClick: false,
        breadcrumb: {
          show: false
        },
        label: {
          show: true,
          formatter: (params: any) => {
            return `${params.name}\n${params.value.toLocaleString('pt-BR')} hab/km²`;
          },
          fontSize: 11,
          color: '#fff',
          fontWeight: 'bold'
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          gapWidth: 2
        },
        levels: [{
          itemStyle: {
            borderColor: '#777',
            borderWidth: 0,
            gapWidth: 1
          }
        }]
      }]
    };
  };

  // Gráfico de IDHM
  const getIDHMChart = () => {
    if (visitedCitiesData.length === 0) return null;

    const citiesWithIDHM = visitedCitiesData
      .sort((a, b) => b.idhm_2010 - a.idhm_2010);

    return {
      title: {
        text: 'IDHM das Cidades Visitadas (2010)',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>IDHM: ${data.value.toFixed(3)}`;
        }
      },
      xAxis: {
        type: 'category',
        data: citiesWithIDHM.map(c => c.nome),
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: 'IDHM',
        min: 0,
        max: 1
      },
      series: [{
        name: 'IDHM',
        type: 'line',
        data: citiesWithIDHM.map(c => c.idhm_2010),
        itemStyle: { color: '#10b981' },
        lineStyle: { color: '#10b981' }
      }]
    };
  };

  // Gráfico de barras horizontais para PIB per capita
  const getPIBChart = () => {
    if (visitedCitiesData.length === 0) return null;

    const topCitiesPIB = visitedCitiesData
      .sort((a, b) => b.pib_per_capita_2020 - a.pib_per_capita_2020)
      .slice(0, 15);

    const data = topCitiesPIB.map(city => ({
      name: city.nome,
      value: city.pib_per_capita_2020,
      population: city.populacao_estimada_censo_2024
    }));

    return {
      title: {
        text: 'Top 15 Cidades por PIB per Capita (2020)',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>PIB per capita: R$ ${data.value.toLocaleString('pt-BR')}<br/>População: ${data.data.population.toLocaleString('pt-BR')} hab`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => 'R$ ' + (value / 1000).toFixed(0) + 'k'
        }
      },
      yAxis: {
        type: 'category',
        data: data.map(d => d.name),
        inverse: true,
        axisLabel: {
          fontSize: 11
        }
      },
      series: [{
        name: 'PIB per Capita',
        type: 'bar',
        data: data,
        itemStyle: {
          color: (params: any) => {
            const colors = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'];
            return colors[params.dataIndex % colors.length];
          }
        },
        emphasis: {
          itemStyle: {
            color: '#047857'
          }
        },
        barWidth: '60%'
      }]
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Ver Estatísticas Completas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-[9999] bg-background border border-border">
        <DialogHeader className="bg-background border-b border-border pb-4">
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Estatísticas Detalhadas - Viaje.ro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="h-4 w-4 text-teal" />
                  Cidades Visitadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-teal">
                  {cities.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {statePercentages.length} estado{statePercentages.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Área Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {totalArea.toLocaleString('pt-BR')} km²
                </p>
                <p className="text-sm text-muted-foreground">
                  área territorial visitada
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4 text-orange" />
                  Cobertura do Brasil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange">
                  {brazilPercentage.toFixed(4)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  do território nacional
                </p>
              </CardContent>
            </Card>
          </div>


          {/* Seção de Gráficos Expandível */}
          {visitedCitiesData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Análises Detalhadas
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCharts(!showCharts)}
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {showCharts ? 'Ocultar Gráficos' : 'Ver Gráficos'}
                    {showCharts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showCharts && (
                <CardContent>
                  <div className="grid gap-6">
                    {/* Gráfico de Distribuição por Estado */}
                    {statePercentages.length > 0 && getStateDistributionChart() && (
                      <div>
                        <ReactECharts 
                          option={getStateDistributionChart()} 
                          style={{ height: '400px', width: '100%' }}
                          opts={{ renderer: 'svg' }}
                        />
                      </div>
                    )}

                    {/* Gráfico de Cobertura por Estado */}
                    {statePercentages.length > 0 && getStatePercentageChart() && (
                      <div>
                        <ReactECharts 
                          option={getStatePercentageChart()} 
                          style={{ height: '400px', width: '100%' }}
                          opts={{ renderer: 'svg' }}
                        />
                      </div>
                    )}

                    {/* Gráfico de População */}
                    {getPopulationChart() && (
                      <div>
                        <ReactECharts 
                          option={getPopulationChart()} 
                          style={{ height: '350px', width: '100%' }}
                          opts={{ renderer: 'svg' }}
                        />
                      </div>
                    )}

                    {/* Gráfico de Densidade */}
                    {getDensityChart() && (
                      <div>
                        <ReactECharts 
                          option={getDensityChart()} 
                          style={{ height: '350px', width: '100%' }}
                          opts={{ renderer: 'svg' }}
                        />
                      </div>
                    )}

                    {/* Gráfico de IDHM */}
                    {getIDHMChart() && (
                      <div>
                        <ReactECharts 
                          option={getIDHMChart()} 
                          style={{ height: '350px', width: '100%' }}
                          opts={{ renderer: 'svg' }}
                        />
                      </div>
                    )}

                    {/* Gráfico de PIB per capita */}
                    {getPIBChart() && (
                      <div>
                        <ReactECharts 
                          option={getPIBChart()} 
                          style={{ height: '350px', width: '100%' }}
                          opts={{ renderer: 'svg' }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Cidades Extremas */}
          {cities.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cidades Extremas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Por Área Territorial */}
                  {largestCityByArea && smallestCityByArea && (
                    <div>
                      <h5 className="font-medium mb-3 text-muted-foreground">Por Área Territorial</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <h4 className="font-semibold text-green-700 dark:text-green-400">Maior</h4>
                          </div>
                          <p className="text-lg font-bold text-green-800 dark:text-green-300">{largestCityByArea.properties.nome}</p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            {largestCityByArea.properties.estado} • {largestCityByArea.properties.area.toLocaleString('pt-BR')} km²
                          </p>
                        </div>
                        
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="h-4 w-4 text-blue-600" />
                            <h4 className="font-semibold text-blue-700 dark:text-blue-400">Menor</h4>
                          </div>
                          <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{smallestCityByArea.properties.nome}</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            {smallestCityByArea.properties.estado} • {smallestCityByArea.properties.area.toLocaleString('pt-BR')} km²
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Por População */}
                  {largestCityByPopulation && smallestCityByPopulation && (
                    <div>
                      <h5 className="font-medium mb-3 text-muted-foreground">Por População (Censo 2024)</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            <h4 className="font-semibold text-purple-700 dark:text-purple-400">Mais Populosa</h4>
                          </div>
                          <p className="text-lg font-bold text-purple-800 dark:text-purple-300">{largestCityByPopulation.nome}</p>
                          <p className="text-sm text-purple-600 dark:text-purple-400">
                            {largestCityByPopulation.estado} • {largestCityByPopulation.populacao_estimada_censo_2024.toLocaleString('pt-BR')} hab
                          </p>
                        </div>
                        
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-indigo-600" />
                            <h4 className="font-semibold text-indigo-700 dark:text-indigo-400">Menos Populosa</h4>
                          </div>
                          <p className="text-lg font-bold text-indigo-800 dark:text-indigo-300">{smallestCityByPopulation.nome}</p>
                          <p className="text-sm text-indigo-600 dark:text-indigo-400">
                            {smallestCityByPopulation.estado} • {smallestCityByPopulation.populacao_estimada_censo_2024.toLocaleString('pt-BR')} hab
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Por Densidade Demográfica */}
                  {highestDensityCity && lowestDensityCity && (
                    <div>
                      <h5 className="font-medium mb-3 text-muted-foreground">Por Densidade Demográfica</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Building className="h-4 w-4 text-orange-600" />
                            <h4 className="font-semibold text-orange-700 dark:text-orange-400">Maior Densidade</h4>
                          </div>
                          <p className="text-lg font-bold text-orange-800 dark:text-orange-300">{highestDensityCity.nome}</p>
                          <p className="text-sm text-orange-600 dark:text-orange-400">
                            {highestDensityCity.estado} • {highestDensityCity.densidade_demografica_2022.toLocaleString('pt-BR')} hab/km²
                          </p>
                        </div>
                        
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Building className="h-4 w-4 text-amber-600" />
                            <h4 className="font-semibold text-amber-700 dark:text-amber-400">Menor Densidade</h4>
                          </div>
                          <p className="text-lg font-bold text-amber-800 dark:text-amber-300">{lowestDensityCity.nome}</p>
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            {lowestDensityCity.estado} • {lowestDensityCity.densidade_demografica_2022.toLocaleString('pt-BR')} hab/km²
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                   {/* Por Escolarização */}
                   {highestSchoolingCities.length > 0 && lowestSchoolingCities.length > 0 && (
                     <div>
                       <h5 className="font-medium mb-3 text-muted-foreground">Por Índice de Escolarização</h5>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <ExpandableCityList
                           cities={highestSchoolingCities}
                           bgColorClass="bg-teal-50 dark:bg-teal-900/20"
                           textColorClass="text-teal-800 dark:text-teal-300"
                           borderColorClass="border-teal-200 dark:border-teal-800"
                           iconColorClass="text-teal-600"
                           titleColorClass="text-teal-700 dark:text-teal-400"
                           subtitleColorClass="text-teal-600 dark:text-teal-400"
                           icon={GraduationCap}
                           value={(city) => `${city.escolarizacao_6a14_2022.toFixed(1)}%`}
                           unit={`Maior${highestSchoolingCities.length > 1 ? 'es' : ''} Índice${highestSchoolingCities.length > 1 ? 's' : ''}`}
                         />
                         
                         <ExpandableCityList
                           cities={lowestSchoolingCities}
                           bgColorClass="bg-cyan-50 dark:bg-cyan-900/20"
                           textColorClass="text-cyan-800 dark:text-cyan-300"
                           borderColorClass="border-cyan-200 dark:border-cyan-800"
                           iconColorClass="text-cyan-600"
                           titleColorClass="text-cyan-700 dark:text-cyan-400"
                           subtitleColorClass="text-cyan-600 dark:text-cyan-400"
                           icon={GraduationCap}
                           value={(city) => `${city.escolarizacao_6a14_2022.toFixed(1)}%`}
                           unit={`Menor${lowestSchoolingCities.length > 1 ? 'es' : ''} Índice${lowestSchoolingCities.length > 1 ? 's' : ''}`}
                         />
                       </div>
                     </div>
                   )}

                   {/* Por IDHM */}
                   {highestIDHMCities.length > 0 && lowestIDHMCities.length > 0 && (
                     <div>
                       <h5 className="font-medium mb-3 text-muted-foreground">Por IDHM (2010)</h5>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <ExpandableCityList
                           cities={highestIDHMCities}
                           bgColorClass="bg-emerald-50 dark:bg-emerald-900/20"
                           textColorClass="text-emerald-800 dark:text-emerald-300"
                           borderColorClass="border-emerald-200 dark:border-emerald-800"
                           iconColorClass="text-emerald-600"
                           titleColorClass="text-emerald-700 dark:text-emerald-400"
                           subtitleColorClass="text-emerald-600 dark:text-emerald-400"
                           icon={Heart}
                           value={(city) => city.idhm_2010.toFixed(3)}
                           unit={`Maior${highestIDHMCities.length > 1 ? 'es' : ''} IDHM`}
                         />
                         
                         <ExpandableCityList
                           cities={lowestIDHMCities}
                           bgColorClass="bg-red-50 dark:bg-red-900/20"
                           textColorClass="text-red-800 dark:text-red-300"
                           borderColorClass="border-red-200 dark:border-red-800"
                           iconColorClass="text-red-600"
                           titleColorClass="text-red-700 dark:text-red-400"
                           subtitleColorClass="text-red-600 dark:text-red-400"
                           icon={Heart}
                           value={(city) => city.idhm_2010.toFixed(3)}
                           unit={`Menor${lowestIDHMCities.length > 1 ? 'es' : ''} IDHM`}
                         />
                       </div>
                     </div>
                   )}

                   {/* Por PIB per Capita */}
                   {highestPIBCities.length > 0 && lowestPIBCities.length > 0 && (
                     <div>
                       <h5 className="font-medium mb-3 text-muted-foreground">Por PIB per Capita (2020)</h5>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <ExpandableCityList
                           cities={highestPIBCities}
                           bgColorClass="bg-yellow-50 dark:bg-yellow-900/20"
                           textColorClass="text-yellow-800 dark:text-yellow-300"
                           borderColorClass="border-yellow-200 dark:border-yellow-800"
                           iconColorClass="text-yellow-600"
                           titleColorClass="text-yellow-700 dark:text-yellow-400"
                           subtitleColorClass="text-yellow-600 dark:text-yellow-400"
                           icon={DollarSign}
                           value={(city) => `R$ ${city.pib_per_capita_2020.toLocaleString('pt-BR')}`}
                           unit={`Maior${highestPIBCities.length > 1 ? 'es' : ''} PIB per Capita`}
                         />
                         
                         <ExpandableCityList
                           cities={lowestPIBCities}
                           bgColorClass="bg-gray-50 dark:bg-gray-900/20"
                           textColorClass="text-gray-800 dark:text-gray-300"
                           borderColorClass="border-gray-200 dark:border-gray-800"
                           iconColorClass="text-gray-600"
                           titleColorClass="text-gray-700 dark:text-gray-400"
                           subtitleColorClass="text-gray-600 dark:text-gray-400"
                           icon={DollarSign}
                           value={(city) => `R$ ${city.pib_per_capita_2020.toLocaleString('pt-BR')}`}
                           unit={`Menor${lowestPIBCities.length > 1 ? 'es' : ''} PIB per Capita`}
                         />
                       </div>
                     </div>
                   )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista Detalhada por Estado */}
          {statePercentages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhamento por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    {statePercentages.map(({ state, totalArea, stateArea, percentage, citiesCount, cities: stateCities }) => (
                      <div key={state} className="p-4 bg-teal/10 rounded-lg border border-teal/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-teal">{state}</h4>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="p-1 hover:bg-teal/10 rounded-full transition-colors">
                                  <Info className="h-4 w-4 text-muted-foreground hover:text-teal cursor-pointer" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-3 bg-background border border-border shadow-lg">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">Área territorial do estado:</p>
                                  <p className="text-lg font-bold text-teal">{stateArea.toLocaleString('pt-BR')} km²</p>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-teal">{percentage.toFixed(2)}%</p>
                            <p className="text-xs text-muted-foreground">do estado</p>
                          </div>
                        </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          <strong>Área visitada:</strong> {totalArea.toLocaleString('pt-BR')} km²
                        </div>
                        <div>
                          <strong>Cidades:</strong> {citiesCount} cidade{citiesCount > 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          <strong>Cidades visitadas:</strong> {stateCities.join(', ')}
                        </p>
                      </div>
                    </div>
                    ))}
                  </div>
              </CardContent>
            </Card>
          )}

          {/* Informações Adicionais */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Metodologia:</strong> As porcentagens são calculadas com base nas áreas oficiais dos estados e do Brasil.</p>
                <p><strong>Fonte dos dados:</strong> IBGE - Instituto Brasileiro de Geografia e Estatística</p>
                <p><strong>Área total do Brasil:</strong> {countryData.area_territorial_km2.toLocaleString('pt-BR')} km²</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};