import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { findMunicipalityGeometry, GeoJSONFeature as ImportedGeoJSONFeature } from '@/utils/geoJsonLoader';
import { CityInfoModal } from './CityInfoModal';
import { CityReviewModal } from './CityReviewModal';
import { getCityData } from '@/data/getCityData';
import { useSettings } from '@/contexts/SettingsContext';
import { useCityReviews } from '@/hooks/useCityReviews';

// Tipos para GeoJSON
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

// Correção para marcadores padrão do Leaflet
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
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const { stateColors } = useSettings();
  const { getReview, getReviewPhotos, saveReview, deleteReview, deletePhoto, setCoverPhoto, removeCoverPhoto, updateCoverPosition, reviews, photos } = useCityReviews();
  const loadedCitiesRef = useRef<Set<string>>(new Set());
  const isLoadingRef = useRef(false);

  // Inicializar mapa uma vez
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

  // Função auxiliar para criar conteúdo do popup
  const createPopupContent = (cityName: string, stateName: string, review: any, idSuffix: string = '') => {
    const popupContent = document.createElement('div');
    popupContent.className = 'p-3 min-w-[200px]';
    popupContent.innerHTML = `
      <div class="space-y-2">
        <div class="border-b pb-1.5">
          <h3 class="font-semibold text-base leading-tight">${cityName}</h3>
          <p class="text-sm text-muted-foreground mt-0.5">${stateName}</p>
        </div>
        <div class="flex flex-col gap-1.5">
          <button id="btn-info-${cityName.replace(/\s/g, '-')}${idSuffix}" class="w-full px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors flex items-center justify-center gap-2">
            <span>ℹ️</span>
            <span>Ver Informações</span>
          </button>
          <button id="btn-review-${cityName.replace(/\s/g, '-')}${idSuffix}" class="w-full px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors flex items-center justify-center gap-2">
            <span>⭐</span>
            <span>${review ? 'Ver Avaliação' : 'Adicionar Avaliação'}</span>
          </button>
        </div>
      </div>
    `;
    return popupContent;
  };

  // Função auxiliar para configurar eventos do popup
  const setupPopupEvents = (cityName: string, cityData: any, idSuffix: string = '') => {
    setTimeout(() => {
      const btnInfo = document.getElementById(`btn-info-${cityName.replace(/\s/g, '-')}${idSuffix}`);
      const btnReview = document.getElementById(`btn-review-${cityName.replace(/\s/g, '-')}${idSuffix}`);
      
      if (btnInfo && cityData) {
        btnInfo.onclick = () => {
          setSelectedCity(cityData);
          setIsModalOpen(true);
          mapInstanceRef.current?.closePopup();
        };
      }
      
      if (btnReview && cityData) {
        btnReview.onclick = () => {
          setSelectedCity(cityData);
          setIsReviewModalOpen(true);
          mapInstanceRef.current?.closePopup();
        };
      }
    }, 100);
  };

  // Função auxiliar para adicionar camada da cidade com suporte a foto de capa usando sobreposição SVG
  const addCityLayerWithCover = async (
    feature: GeoJSONFeature, 
    stateColor: string, 
    cityData: any, 
    review: any,
    coverPhoto: any
  ) => {
    if (!mapInstanceRef.current) return;

    if (coverPhoto && review) {
      try {
        // Obter os limites do polígono
        const bounds = L.geoJSON(feature).getBounds();
        
        // Calcular posicionamento com base na posição salva
        const posX = review.cover_photo_position_x || 0.5;
        const posY = review.cover_photo_position_y || 0.5;
        const scale = review.cover_photo_scale || 1.0;
        
        // Processar todos os polígonos (incluindo MultiPolygon com ilhas)
        const boundsWidth = bounds.getEast() - bounds.getWest();
        const boundsHeight = bounds.getNorth() - bounds.getSouth();
        const boundsNorth = bounds.getNorth();
        const boundsSouth = bounds.getSouth();
        
        // Coletar todos os polígonos para o clipPath
        const allPolygons: string[] = [];
        
        if (feature.geometry.type === 'Polygon') {
          const polygonCoords = feature.geometry.coordinates as number[][][];
          polygonCoords.forEach((ring) => {
            const points = ring.map((c: number[]) => 
              `${c[0]},${boundsNorth - (c[1] - boundsSouth)}`
            ).join(' ');
            allPolygons.push(`<polygon points="${points}" />`);
          });
        } else if (feature.geometry.type === 'MultiPolygon') {
          const multiPolygonCoords = feature.geometry.coordinates as number[][][][];
          multiPolygonCoords.forEach((polygon: number[][][]) => {
            polygon.forEach((ring) => {
              const points = ring.map((c: number[]) => 
                `${c[0]},${boundsNorth - (c[1] - boundsSouth)}`
              ).join(' ');
              allPolygons.push(`<polygon points="${points}" />`);
            });
          });
        }
        
        // Carregar imagem para obter dimensões reais
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        try {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout ao carregar imagem'));
            }, 10000); // 10 segundos de timeout
            
            img.onload = () => {
              clearTimeout(timeout);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Erro ao carregar imagem'));
            };
            img.src = coverPhoto.photo_url;
          });
        } catch (error) {
          console.error('Erro ao carregar imagem de capa:', error);
          // Se falhar ao carregar imagem, usar camada padrão
          addStandardCityLayer(feature, stateColor, cityData, review);
          return;
        }
        
        // Calcular dimensões da imagem mantendo proporção
        const imageAspectRatio = img.width / img.height;
        const boundsAspectRatio = boundsWidth / boundsHeight;
        
        let imageWidth: number;
        let imageHeight: number;
        
        if (imageAspectRatio > boundsAspectRatio) {
          // Imagem é mais larga - ajustar pela largura
          imageWidth = boundsWidth * scale;
          imageHeight = imageWidth / imageAspectRatio;
        } else {
          // Imagem é mais alta - ajustar pela altura
          imageHeight = boundsHeight * scale;
          imageWidth = imageHeight * imageAspectRatio;
        }
        
        const imageX = bounds.getWest() + (posX * boundsWidth) - (imageWidth / 2);
        const imageY = bounds.getSouth() + (posY * boundsHeight) - (imageHeight / 2);
        
        // Criar sobreposição SVG com caminho de recorte
        const uniqueId = feature.properties.CD_MUN || Math.random().toString().replace('.', '');
        const svgOverlay = L.svgOverlay(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.getWest()} ${bounds.getSouth()} ${boundsWidth} ${boundsHeight}">
            <defs>
              <clipPath id="clip-${uniqueId}">
                ${allPolygons.join('')}
              </clipPath>
            </defs>
            <g clip-path="url(#clip-${uniqueId})">
              <image href="${coverPhoto.photo_url}" 
                     x="${imageX}" 
                     y="${imageY}" 
                     width="${imageWidth}" 
                     height="${imageHeight}" 
                     preserveAspectRatio="none" />
            </g>
          </svg>`,
          bounds,
          {
            opacity: 1,
            interactive: false,
          }
        );
        
        svgOverlay.addTo(mapInstanceRef.current);
        layersRef.current.push(svgOverlay);
        
        // Adicionar popup à sobreposição SVG (vamos torná-la interativa)
        const popupContent = createPopupContent(feature.properties.nome, feature.properties.estado, review);
        
        // Criar camada de contorno para interação do popup e borda visível
        const outlineLayer = L.geoJSON(feature, {
          style: {
            color: stateColor,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0,
          },
          interactive: true,
        });
        
        outlineLayer.bindPopup(popupContent, {
          maxWidth: 250,
          className: 'custom-popup'
        });

        outlineLayer.on('popupopen', () => {
          setupPopupEvents(feature.properties.nome, cityData);
        });
        
        outlineLayer.addTo(mapInstanceRef.current);
        layersRef.current.push(outlineLayer);
      } catch (error) {
        console.error('Error loading cover photo:', error);
        addStandardCityLayer(feature, stateColor, cityData, review);
      }
    } else {
      // Sem foto de capa, usar camada padrão
      addStandardCityLayer(feature, stateColor, cityData, review);
    }
  };

  // Função auxiliar para adicionar camada padrão da cidade sem foto de capa
  const addStandardCityLayer = (feature: GeoJSONFeature, stateColor: string, cityData: any, review: any) => {
    if (!mapInstanceRef.current) return;

    const layer = L.geoJSON(feature, {
      style: {
        color: stateColor,
        weight: 2,
        opacity: 0.8,
        fillColor: stateColor,
        fillOpacity: 0.3
      }
    });

    const popupContent = createPopupContent(feature.properties.nome, feature.properties.estado, review);
    layer.bindPopup(popupContent, {
      maxWidth: 250,
      className: 'custom-popup'
    });

    layer.on('popupopen', () => {
      setupPopupEvents(feature.properties.nome, cityData);
    });

    layer.addTo(mapInstanceRef.current);
    layersRef.current.push(layer);
  };

  // Atualizar cidades
  useEffect(() => {
    if (!mapInstanceRef.current || isLoadingRef.current) return;

    const currentCitiesKey = cities.map(c => `${c.properties.nome}-${c.properties.estado}`).sort().join(',');
    const loadedCitiesKey = Array.from(loadedCitiesRef.current).sort().join(',');
    
    if (currentCitiesKey === loadedCitiesKey) return;

    isLoadingRef.current = true;

    // Limpar camadas existentes
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
        // Carregar geometrias em paralelo em lotes para não sobrecarregar
        const BATCH_SIZE = 10;
        const batches: typeof cities[] = [];
        for (let i = 0; i < cities.length; i += BATCH_SIZE) {
          batches.push(cities.slice(i, i + BATCH_SIZE));
        }

        // Processar cada lote em paralelo, mas renderizar progressivamente
        for (const batch of batches) {
          // Carregar todas as geometrias do lote em paralelo
          const geometryPromises = batch.map(async (city) => {
            try {
              const realGeometry = await findMunicipalityGeometry(city.properties.nome, city.properties.estado);
              return { city, geometry: realGeometry };
            } catch (error) {
              console.warn(`Erro ao carregar geometria para ${city.properties.nome}:`, error);
              return { city, geometry: null };
            }
          });

          const results = await Promise.all(geometryPromises);

          // Renderizar cada cidade conforme carrega
          for (const { city, geometry } of results) {
            if (geometry) {
              const convertedFeature: GeoJSONFeature = {
                type: "Feature",
                properties: { 
                  ...geometry.properties, 
                  estado: city.properties.estado,
                  nome: city.properties.nome,
                  area: city.properties.area
                },
                geometry: geometry.geometry as GeoJSONPolygon | GeoJSONMultiPolygon
              };

              const state = city.properties.estado;
              const stateColor = stateColors[state] || '#ff7800';
              const cityData = getCityData(city.properties.nome, city.properties.estado);
              const review = cityData ? getReview(cityData.nome, cityData.estado) : undefined;
              
              if (review) {
                const allPhotos = getReviewPhotos(review.id);
                const coverPhoto = allPhotos.find(p => p.is_cover === true);
                await addCityLayerWithCover(convertedFeature, stateColor, cityData, review, coverPhoto || null);
              } else {
                await addCityLayerWithCover(convertedFeature, stateColor, cityData, review, null);
              }

              loadedCitiesRef.current.add(`${city.properties.nome}-${city.properties.estado}`);
            }
          }
        }


        if (layersRef.current.length > 0) {
          const group = new L.FeatureGroup(layersRef.current);
          mapInstanceRef.current?.fitBounds(group.getBounds().pad(0.1));
        }
      } catch (error) {
        console.error('Erro ao processar polígonos das cidades:', error);
        
        // Renderização de fallback
        cities.forEach(city => {
          if (city.geometry && mapInstanceRef.current) {
            try {
              const geoJsonFeature = {
                type: "Feature" as const,
                properties: city.properties,
                geometry: city.geometry
              };
              
              const cityData = getCityData(city.properties.nome, city.properties.estado);
              const review = cityData ? getReview(cityData.nome, cityData.estado) : undefined;
              
              const layer = L.geoJSON(geoJsonFeature, {
                style: {
                  color: stateColors[city.properties.estado] || '#ff7800',
                  weight: 2,
                  opacity: 0.8,
                  fillColor: stateColors[city.properties.estado] || '#ff7800',
                  fillOpacity: 0.3
                }
              });

              const popupContent = createPopupContent(city.properties.nome, city.properties.estado, review, '-fallback');
              layer.bindPopup(popupContent, {
                maxWidth: 250,
                className: 'custom-popup'
              });

              layer.on('popupopen', () => {
                setupPopupEvents(city.properties.nome, cityData, '-fallback');
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
          mapInstanceRef.current?.fitBounds(group.getBounds().pad(0.1));
        }
      } finally {
        isLoadingRef.current = false;
      }
    };
    
    loadCityGeometriesAndUnify();
  }, [cities, stateColors, getReview, getReviewPhotos, reviews, photos]);

  const handleSaveReview = async (
    rating: number, 
    comment: string, 
    photoFiles: File[], 
    coverPhotoIndex: number | null,
    coverPosition: { x: number; y: number; scale: number }
  ) => {
    if (!selectedCity) return false;
    const success = await saveReview(
      selectedCity.nome, 
      selectedCity.estado, 
      rating, 
      comment, 
      photoFiles, 
      coverPhotoIndex,
      coverPosition
    );
    
    if (success) {
      // Atualizar posição da capa se a avaliação existir
      const updatedReview = getReview(selectedCity.nome, selectedCity.estado);
      if (updatedReview) {
        await updateCoverPosition(selectedCity.nome, selectedCity.estado, coverPosition);
      }
      
      // Forçar recarregamento do mapa limpando cidades carregadas
      loadedCitiesRef.current.clear();
    }
    
    return success;
  };

  const handleDeleteReview = async () => {
    if (!selectedCity) return false;
    return await deleteReview(selectedCity.nome, selectedCity.estado);
  };

  // Recalcular currentReview e currentPhotos quando reviews ou photos mudarem
  // Usar useMemo para garantir que seja recalculado quando os dados mudarem
  const currentReview = selectedCity ? getReview(selectedCity.nome, selectedCity.estado) : undefined;
  const currentPhotos = currentReview ? getReviewPhotos(currentReview.id) : [];

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />
      
      {selectedCity && (
        <>
          <CityInfoModal
            city={selectedCity}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />

          <CityReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            cityName={selectedCity.nome}
            stateName={selectedCity.estado}
            existingReview={currentReview}
            existingPhotos={currentPhotos}
            onSave={handleSaveReview}
            onDelete={currentReview ? handleDeleteReview : undefined}
            onDeletePhoto={deletePhoto}
            onSetCoverPhoto={setCoverPhoto}
            onRemoveCoverPhoto={currentReview ? async () => {
              await removeCoverPhoto(currentReview.id);
            } : undefined}
          />
        </>
      )}
    </div>
  );
};