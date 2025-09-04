// Utilitário para carregar e processar dados GeoJSON dos municípios brasileiros

export interface GeoJSONFeature {
  type: "Feature";
  properties: {
    [key: string]: any;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJSONCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// Cache para os dados GeoJSON
let geoJsonData: GeoJSONCollection | null = null;

// Função para carregar os dados GeoJSON
export const loadGeoJsonData = async (): Promise<GeoJSONCollection> => {
  if (geoJsonData) {
    return geoJsonData;
  }

  try {
    // Carregar dados GeoJSON dos municípios
    const response = await fetch('/viaje.ro/src/data/municipios.geojson');
    geoJsonData = await response.json();
    return geoJsonData;
  } catch (error) {
    console.error('Erro ao carregar dados GeoJSON:', error);
    // Retornar estrutura vazia em caso de erro
    geoJsonData = { type: "FeatureCollection", features: [] };
    return geoJsonData;
  }
};

// Função para buscar a geometria de um município específico
export const findMunicipalityGeometry = async (cityName: string, stateName: string): Promise<GeoJSONFeature | null> => {
  try {
    const data = await loadGeoJsonData();
    
    // Normalizar nomes para busca
    const normalizedCityName = cityName.toLowerCase().trim();
    const normalizedStateName = stateName.toLowerCase().trim();
    
    // Buscar o município nos dados GeoJSON
    const feature = data.features.find(feature => {
      const props = feature.properties;
      
      // Tentar diferentes campos comuns em dados do IBGE
      const municipioName = (props.NM_MUN || props.nome || props.name || '').toLowerCase();
      const estadoName = (props.NM_UF || props.estado || props.state || props.sigla_uf || '').toLowerCase();
      
      // Verificar se encontrou correspondência exata
      const cityMatch = municipioName === normalizedCityName;
      const stateMatch = estadoName === normalizedStateName || estadoName.includes(normalizedStateName) || normalizedStateName.includes(estadoName);
      
      return cityMatch && stateMatch;
    });
    
    return feature || null;
  } catch (error) {
    console.warn(`Erro ao buscar geometria para ${cityName}, ${stateName}:`, error);
    return null;
  }
};

// Função para gerar coordenadas mock quando não encontrar dados reais
export const generateMockGeometry = (stateName: string): GeoJSONFeature => {
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

  const [centerLng, centerLat] = stateCoordinates[stateName] || [-44.0, -19.0];
  const offset = 0.05; // Reduzir o offset para polígonos menores
  
  return {
    type: "Feature",
    properties: {
      nome: "Mock Municipality",
      estado: stateName
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [centerLng - offset, centerLat - offset],
        [centerLng + offset, centerLat - offset],
        [centerLng + offset, centerLat + offset],
        [centerLng - offset, centerLat + offset],
        [centerLng - offset, centerLat - offset]
      ]]
    }
  };
};