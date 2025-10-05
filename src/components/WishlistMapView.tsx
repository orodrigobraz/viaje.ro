import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { City } from '@/data/mockData';
import { findMunicipalityGeometry, GeoJSONFeature as ImportedGeoJSONFeature } from '@/utils/geoJsonLoader';
import { useSettings } from '@/contexts/SettingsContext';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface WishlistMapViewProps {
  cities: City[];
}

export const WishlistMapView = ({ cities }: WishlistMapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { wishlistColor } = useSettings();
  const layersRef = useRef<L.Layer[]>([]);
  const loadedCitiesRef = useRef<Set<string>>(new Set());
  const isLoadingRef = useRef(false);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      center: [-14.235, -51.9253],
      zoom: 4,
      zoomControl: true,
    });

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
    
    if (currentCitiesKey === loadedCitiesKey) return;

    isLoadingRef.current = true;
    const map = mapInstanceRef.current;

    layersRef.current.forEach(layer => {
      map.removeLayer(layer);
    });
    layersRef.current = [];
    loadedCitiesRef.current.clear();

    if (cities.length === 0) {
      isLoadingRef.current = false;
      return;
    }

    const loadCityGeometriesAndUnify = async () => {
      try {
        const cityFeatures: any[] = [];

        for (const city of cities) {
          try {
            const realGeometry = await findMunicipalityGeometry(
              city.properties.nome,
              city.properties.estado
            );

            if (realGeometry) {
              cityFeatures.push({
                type: 'Feature',
                properties: {
                  nome: city.properties.nome,
                  estado: city.properties.estado,
                  area: realGeometry.properties?.area_km2 || city.properties.area
                },
                geometry: realGeometry.geometry
              });
            } else {
              cityFeatures.push({
                type: 'Feature',
                properties: {
                  nome: city.properties.nome,
                  estado: city.properties.estado,
                  area: city.properties.area
                },
                geometry: city.geometry
              });
            }
            loadedCitiesRef.current.add(`${city.properties.nome}-${city.properties.estado}`);
          } catch (error) {
            console.warn(`Erro ao carregar geometria para ${city.properties.nome}:`, error);
            cityFeatures.push({
              type: 'Feature',
              properties: {
                nome: city.properties.nome,
                estado: city.properties.estado,
                area: city.properties.area
              },
              geometry: city.geometry
            });
            loadedCitiesRef.current.add(`${city.properties.nome}-${city.properties.estado}`);
          }
        }

        cityFeatures.forEach((feature) => {
          const layer = L.geoJSON(feature, {
            style: {
              color: wishlistColor,
              weight: 2,
              opacity: 0.8,
              fillColor: wishlistColor,
              fillOpacity: 0.3
            }
          }).bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-lg text-purple-800">${feature.properties.nome}</h3>
              <p class="text-sm text-purple-600">${feature.properties.estado}</p>
              <p class="text-sm text-purple-600">Área: ${feature.properties.area?.toLocaleString('pt-BR') || 'N/A'} km²</p>
            </div>
          `);

          layer.addTo(map);
          layersRef.current.push(layer);
        });

        if (layersRef.current.length > 0) {
          const group = new L.FeatureGroup(layersRef.current as L.Layer[]);
          map.fitBounds(group.getBounds(), { padding: [20, 20] });
        }
      } catch (error) {
        console.error('Erro ao carregar geometrias:', error);
      } finally {
        isLoadingRef.current = false;
      }
    };

    loadCityGeometriesAndUnify();
  }, [cities, wishlistColor]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border shadow-lg">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
};