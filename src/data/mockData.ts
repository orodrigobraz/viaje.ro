// Dados do sistema Viaje.ro carregados dos arquivos JSON
import cidadesData from './cidades.json';
import estadosData from './estados.json';
import paisData from './pais.json';

export interface CityData {
  nome: string;
  estado: string;
  gentilico: string;
  area_territorial_km2: number;
  populacao_estimada_censo_2024: number;
  populacao_estimada_censo_2022: number;
  densidade_demografica_2022: number;
  escolarizacao_6a14_2022: number;
  idhm_2010: number;
  mortalidade_infantil_2023: string | number;
  pib_per_capita_2020: number;
  codigo_ibge: string;
}

export interface City {
  properties: {
    nome: string;
    area: number; // em km²
    estado: string;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon" | "Point" | "LineString" | "MultiLineString" | "MultiPoint";
    coordinates: number[][][] | number[][]; // GeoJSON coordinates
  };
}

export interface State {
  estado: string;
  area_territorial_km2: number;
}

export interface Country {
  país: string;
  area_territorial_km2: number;
}

// Dados carregados dos arquivos JSON
export const citiesData: CityData[] = cidadesData.cidades as CityData[];
export const statesData: State[] = estadosData.estados;
export const countryData: Country = paisData.país[0];

// Converter dados de cidades para o formato usado pelo mapa
const convertCityDataToCity = (cityData: CityData): City => {
  // Coordenadas mock baseadas no estado (serão carregadas dinamicamente no mapa)
  const mockCoordinates = generateMockCoordinates(cityData.estado);
  
  return {
    properties: {
      nome: cityData.nome,
      area: cityData.area_territorial_km2,
      estado: cityData.estado
    },
    geometry: {
      type: "Polygon",
      coordinates: [mockCoordinates]
    }
  };
};

// Gerar coordenadas mock baseadas no estado (substituir por dados reais do IBGE)
const generateMockCoordinates = (estado: string): number[][] => {
  // Coordenadas aproximadas dos centros dos estados brasileiros
  const stateCoordinates: { [key: string]: [number, number] } = {
    "Acre": [-70.0, -9.0],
    "Alagoas": [-36.0, -9.5],
    "Amapá": [-52.0, 1.0],
    "Amazonas": [-63.0, -5.0],
    "Bahia": [-41.0, -13.0],
    "Ceará": [-39.0, -5.0],
    "Distrito Federal": [-47.9, -15.8],
    "Espírito Santo": [-40.0, -20.0],
    "Goiás": [-49.0, -16.0],
    "Maranhão": [-45.0, -5.0],
    "Mato Grosso": [-56.0, -12.0],
    "Mato Grosso do Sul": [-55.0, -20.0],
    "Minas Gerais": [-44.0, -19.0],
    "Pará": [-52.0, -5.0],
    "Paraíba": [-36.0, -7.0],
    "Paraná": [-51.0, -24.0],
    "Pernambuco": [-37.0, -8.0],
    "Piauí": [-43.0, -7.0],
    "Rio de Janeiro": [-43.0, -22.0],
    "Rio Grande do Norte": [-36.0, -6.0],
    "Rio Grande do Sul": [-53.0, -30.0],
    "Rondônia": [-63.0, -11.0],
    "Roraima": [-61.0, 2.0],
    "Santa Catarina": [-50.0, -27.0],
    "São Paulo": [-47.0, -23.0],
    "Sergipe": [-37.0, -10.5],
    "Tocantins": [-48.0, -10.0]
  };

  const [centerLng, centerLat] = stateCoordinates[estado] || [-44.0, -19.0];
  const offset = 0.1;
  
  return [
    [centerLng - offset, centerLat - offset],
    [centerLng + offset, centerLat - offset],
    [centerLng + offset, centerLat + offset],
    [centerLng - offset, centerLat + offset],
    [centerLng - offset, centerLat - offset]
  ];
};

// Função para buscar cidade por nome e estado
export const searchCity = (cityName: string, stateName?: string): City | null => {
  const normalizedSearch = cityName.toLowerCase().trim();
  const normalizedState = stateName?.toLowerCase().trim();
  
  const found = citiesData.find(city => {
    const cityMatch = city.nome.toLowerCase() === normalizedSearch;
    const stateMatch = !normalizedState || city.estado.toLowerCase() === normalizedState;
    return cityMatch && stateMatch;
  });
  
  return found ? convertCityDataToCity(found) : null;
};

// Buscar cidade exatamente por nome e estado
export const searchCityExact = (cityName: string, stateName: string): City | null => {
  const found = citiesData.find(city => 
    city.nome.toLowerCase() === cityName.toLowerCase() && 
    city.estado.toLowerCase() === stateName.toLowerCase()
  );
  return found ? convertCityDataToCity(found) : null;
};

// Função para buscar cidades por estado
export const searchCitiesByState = (stateName: string): CityData[] => {
  const normalizedState = stateName.toLowerCase().trim();
  return citiesData.filter(city => 
    city.estado.toLowerCase() === normalizedState
  );
};

// Função para obter lista de estados únicos
export const getStates = (): string[] => {
  return statesData.map(state => state.estado).sort();
};

// Função para buscar estado por nome
export const searchStates = (searchTerm: string): string[] => {
  const normalizedSearch = searchTerm.toLowerCase().trim();
  return getStates().filter(state =>
    state.toLowerCase().includes(normalizedSearch)
  );
};

// Função para obter área de um estado
export const getStateArea = (stateName: string): number => {
  const state = statesData.find(s => s.estado === stateName);
  return state?.area_territorial_km2 || 0;
};