import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { findMunicipalityGeometry, GeoJSONFeature as ImportedGeoJSONFeature } from '@/utils/geoJsonLoader';
import { CityInfoModal } from './CityInfoModal';
import { getCityData } from '@/data/getCityData';
import { useSettings } from '@/contexts/SettingsContext';

// Types for GeoJSON
type GeoJSONPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

type GeoJSONMultiPolygon = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

type GeoJSONFeature = {
  type: "Feature";
  properties: any;
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon;
};

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface City {
  properties: {
    nome: string;
    area: number;
    estado: string;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon" | "Point" | "LineString" | "MultiLineString" | "MultiPoint";
    coordinates: number[][][] | number[][];
  };
}

interface MapViewProps {
  cities: City[];
}

export const MapView = ({ cities }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { stateColors } = useSettings();
  const loadedCitiesRef = useRef<Set<string>>(new Set());
  const isLoadingRef = useRef(false);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current).setView([-14.2350, -51.9253], 4);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update cities
  useEffect(() => {
    if (!mapInstanceRef.current || isLoadingRef.current) return;

    const currentCitiesKey = cities.map(c => `${c.properties.nome}-${c.properties.estado}`).sort().join(',');
    const loadedCitiesKey = Array.from(loadedCitiesRef.current).sort().join(',');
    
    console.log('MapView - Cidades recebidas:', cities.length);
    console.log('MapView - Primeira cidade:', cities[0]);
    
    if (currentCitiesKey === loadedCitiesKey) return;

    isLoadingRef.current = true;

    // Clear existing layers
    layersRef.current.forEach(layer => {
      mapInstanceRef.current?.removeLayer(layer);
    });
    layersRef.current = [];
    loadedCitiesRef.current.clear();

    if (cities.length === 0) {
      console.log('MapView - Nenhuma cidade para exibir');
      isLoadingRef.current = false;
      return;
    }

    const loadCityGeometriesAndUnify = async () => {
      try {
        const cityFeatures: GeoJSONFeature[] = [];
        
        console.log('MapView - Iniciando carregamento de geometrias para', cities.length, 'cidades');
        
        for (const city of cities) {
          try {
            console.log('MapView - Buscando geometria para:', city.properties.nome, city.properties.estado);
            const realGeometry = await findMunicipalityGeometry(city.properties.nome, city.properties.estado);
            
            if (realGeometry) {
              console.log('MapView - Geometria encontrada para:', city.properties.nome);
              const convertedFeature: GeoJSONFeature = {
                type: "Feature",
                properties: { 
                  ...realGeometry.properties, 
                  estado: city.properties.estado,
                  nome: city.properties.nome,
                  area: city.properties.area
                },
                geometry: realGeometry.geometry as GeoJSONPolygon | GeoJSONMultiPolygon
              };
              cityFeatures.push(convertedFeature);
              loadedCitiesRef.current.add(`${city.properties.nome}-${city.properties.estado}`);
            } else {
              console.warn(`MapView - Geometria não encontrada para ${city.properties.nome}, ${city.properties.estado}`);
            }
          } catch (error) {
            console.warn(`Erro ao carregar geometria para ${city.properties.nome}:`, error);
          }
        }

        console.log('MapView - Total de features carregadas:', cityFeatures.length);

        cityFeatures.forEach((feature) => {
          if (mapInstanceRef.current) {
            const state = feature.properties.estado;
            const stateColor = stateColors[state] || '#ff7800';
            
            console.log('MapView - Adicionando camada para:', feature.properties.nome, 'cor:', stateColor);
            
            const layer = L.geoJSON(feature, {
              style: {
                color: stateColor,
                weight: 2,
                opacity: 0.8,
                fillColor: stateColor,
                fillOpacity: 0.3
              }
            }).on('click', () => {
              console.log('MapView - Clique na cidade:', feature.properties.nome);
              const cityData = getCityData(feature.properties.nome, feature.properties.estado);
              console.log('MapView - Dados da cidade:', cityData);
              if (cityData) {
                setSelectedCity(cityData);
                setIsModalOpen(true);
              }
            });
            
            layer.addTo(mapInstanceRef.current);
            layersRef.current.push(layer);
            console.log('MapView - Camada adicionada, total de camadas:', layersRef.current.length);
          }
        });

        if (layersRef.current.length > 0) {
          const group = new L.FeatureGroup(layersRef.current);
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        }
      } catch (error) {
        console.error('Erro ao processar polígonos das cidades:', error);
        
        layersRef.current.forEach(layer => {
          mapInstanceRef.current?.removeLayer(layer);
        });
        layersRef.current = [];
        
        cities.forEach(city => {
          if (city.geometry && mapInstanceRef.current) {
            try {
              const geoJsonFeature = {
                type: "Feature" as const,
                properties: city.properties,
                geometry: city.geometry
              };
              
              const layer = L.geoJSON(geoJsonFeature, {
                style: {
                  color: stateColors[city.properties.estado] || '#ff7800',
                  weight: 2,
                  opacity: 0.8,
                  fillColor: stateColors[city.properties.estado] || '#ff7800',
                  fillOpacity: 0.3
                }
              }).on('click', () => {
                const cityData = getCityData(city.properties.nome, city.properties.estado);
                if (cityData) {
                  setSelectedCity(cityData);
                  setIsModalOpen(true);
                }
              });
              
              layer.addTo(mapInstanceRef.current);
              layersRef.current.push(layer);
            } catch (error) {
              console.error('Erro ao adicionar cidade ao mapa:', error);
            }
          }
        });

        if (layersRef.current.length > 0) {
          const group = new L.FeatureGroup(layersRef.current);
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        }
      } finally {
        isLoadingRef.current = false;
      }
    };
    
    loadCityGeometriesAndUnify();
  }, [cities, stateColors]);

  return (
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-sm border border-border" />
      <CityInfoModal
        city={selectedCity}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};