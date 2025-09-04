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

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map only once
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([-14.2350, -51.9253], 4); // Centered on Brazil

      // Use a minimal style similar to IBGE maps
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);
    }

    // Clear existing layers
    layersRef.current.forEach(layer => {
      mapInstanceRef.current?.removeLayer(layer);
    });
    layersRef.current = [];

    if (cities.length > 0) {
      // Carregar geometrias reais das cidades de forma assíncrona
      const loadCityGeometriesAndUnify = async () => {
        try {
          const cityFeatures: GeoJSONFeature[] = [];
          
          // Carregar geometrias reais ou usar fallback
          for (const city of cities) {
            try {
              const realGeometry = await findMunicipalityGeometry(city.properties.nome, city.properties.estado);
              
              if (realGeometry) {
                // Converter ImportedGeoJSONFeature para GeoJSONFeature local
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
              } else {
                // Fallback para geometria mock
                cityFeatures.push({
                  type: "Feature",
                  properties: {
                    ...city.properties,
                    nome: city.properties.nome,
                    area: city.properties.area,
                    estado: city.properties.estado
                  },
                  geometry: city.geometry as GeoJSONPolygon | GeoJSONMultiPolygon
                });
              }
            } catch (error) {
              console.warn(`Erro ao carregar geometria para ${city.properties.nome}:`, error);
              // Fallback para geometria mock
              cityFeatures.push({
                type: "Feature",
                properties: {
                  ...city.properties,
                  nome: city.properties.nome,
                  area: city.properties.area,
                  estado: city.properties.estado
                },
                geometry: city.geometry as GeoJSONPolygon | GeoJSONMultiPolygon
              });
            }
          }

          // Clear existing layers first
          layersRef.current.forEach(layer => {
            mapInstanceRef.current?.removeLayer(layer);
          });
          layersRef.current = [];

          // Exibir cada cidade individualmente com cor por estado
          cityFeatures.forEach((feature) => {
            if (mapInstanceRef.current) {
              const state = feature.properties.estado;
              const stateColor = stateColors[state] || '#ff7800';
              
              const layer = L.geoJSON(feature, {
                style: {
                  color: stateColor,
                  weight: 2,
                  opacity: 0.8,
                  fillColor: stateColor,
                  fillOpacity: 0.3
                }
              }).on('click', () => {
                const cityData = getCityData(feature.properties.nome, feature.properties.estado);
                if (cityData) {
                  setSelectedCity(cityData);
                  setIsModalOpen(true);
                }
              });
              
              layer.addTo(mapInstanceRef.current);
              layersRef.current.push(layer);
            }
          });

          // Fit map to show all areas
          if (layersRef.current.length > 0) {
            const group = new L.FeatureGroup(layersRef.current);
            mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
          }
        } catch (error) {
          console.error('Erro ao processar polígonos das cidades:', error);
          
          // Clear existing layers
          layersRef.current.forEach(layer => {
            mapInstanceRef.current?.removeLayer(layer);
          });
          layersRef.current = [];
          
          // Fallback to individual city polygons if union fails
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
                    color: '#ff7800',
                    weight: 2,
                    opacity: 0.8,
                    fillColor: '#ff7800',
                    fillOpacity: 0.3
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
        }
      };
      
      // Executar carregamento assíncrono
      loadCityGeometriesAndUnify();
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
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