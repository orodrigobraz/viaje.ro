// Utilitário para carregar e processar dados GeoJSON dos municípios brasileiros usando Supabase
import { supabase } from '@/integrations/supabase/client';

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

// Função para buscar a geometria de um município específico no Supabase
export const findMunicipalityGeometry = async (cityName: string, stateName: string): Promise<GeoJSONFeature | null> => {
  try {
    // Normalizar nomes para busca
    const normalizedCityName = cityName.toLowerCase().trim();
    const normalizedStateName = stateName.toLowerCase().trim();
    
    // Buscar no Supabase primeiro por nome exato
    let { data: municipality, error } = await supabase
      .from('municipios')
      .select('*')
      .ilike('nm_mun', cityName)
      .ilike('nm_uf', stateName)
      .limit(1)
      .single();

    // Se não encontrou por nome completo, tentar por sigla do estado
    if (!municipality && !error) {
      const { data: altMunicipality, error: altError } = await supabase
        .from('municipios')
        .select('*')
        .ilike('nm_mun', cityName)
        .ilike('sigla_uf', stateName)
        .limit(1)
        .single();
      
      municipality = altMunicipality;
      error = altError;
    }

    if (error || !municipality) {
      console.warn(`Município não encontrado: ${cityName}, ${stateName}`);
      return null;
    }

    // Converter para formato GeoJSON
    const geoJsonFeature: GeoJSONFeature = {
      type: "Feature",
      properties: {
        NM_MUN: municipality.nm_mun,
        NM_UF: municipality.nm_uf,
        SIGLA_UF: municipality.sigla_uf,
        AREA_KM2: municipality.area_km2,
        CD_MUN: municipality.cd_mun,
        nome: municipality.nm_mun,
        estado: municipality.nm_uf,
        sigla_uf: municipality.sigla_uf
      },
      geometry: municipality.geometria as any
    };

    return geoJsonFeature;
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