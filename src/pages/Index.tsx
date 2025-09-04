import { useState } from 'react';
import { Header } from '@/components/Header';
import { StateSelector } from '@/components/StateSelector';
import { CitySelector } from '@/components/CitySelector';
import { MapView } from '@/components/MapView';
import { CityList } from '@/components/CityList';

import { searchCity, City } from '@/data/mockData';
import { StatisticsModal } from '@/components/StatisticsModal';
import { WishlistModal } from '@/components/WishlistModal';
import { toast } from 'sonner';

const Index = () => {
  const [visitedCities, setVisitedCities] = useState<City[]>([]);
  const [wishlistCities, setWishlistCities] = useState<City[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');

  const handleAddCity = (cityName: string) => {
    // Verificar se a cidade já foi adicionada (nome + estado)
    const alreadyAdded = visitedCities.some(
      city => city.properties.nome.toLowerCase() === cityName.toLowerCase() && 
               city.properties.estado.toLowerCase() === selectedState.toLowerCase()
    );

    if (alreadyAdded) {
      toast.error(`${cityName} (${selectedState}) já foi adicionada à lista`);
      return;
    }

    // Buscar cidade exata por nome e estado selecionado
    const foundCity = searchCity(cityName, selectedState);
    
    if (foundCity) {
      setVisitedCities(prev => [...prev, foundCity]);
      toast.success(`${foundCity.properties.nome} adicionada com sucesso!`, {
        description: `${foundCity.properties.estado} • ${foundCity.properties.area.toLocaleString('pt-BR')} km²`
      });
    } else {
      toast.error(`Cidade "${cityName}" não encontrada em ${selectedState}. Verifique o nome e tente novamente.`);
    }
  };

  const handleRemoveCity = (cityName: string) => {
    setVisitedCities(prev => 
      prev.filter(city => city.properties.nome !== cityName)
    );
    toast.success(`${cityName} removida da lista`);
  };

  const handleAddToWishlist = (cityName: string) => {
    // Verificar se a cidade já foi adicionada à lista de desejos (nome + estado)
    const alreadyAdded = wishlistCities.some(
      city => city.properties.nome.toLowerCase() === cityName.toLowerCase() && 
               city.properties.estado.toLowerCase() === selectedState.toLowerCase()
    );

    if (alreadyAdded) {
      toast.error(`${cityName} (${selectedState}) já está na lista de desejos`);
      return;
    }

    // Buscar cidade exata por nome e estado selecionado
    const foundCity = searchCity(cityName, selectedState);
    
    if (foundCity) {
      setWishlistCities(prev => [...prev, foundCity]);
      toast.success(`${foundCity.properties.nome} adicionada à lista de desejos!`, {
        description: `${foundCity.properties.estado} • ${foundCity.properties.area.toLocaleString('pt-BR')} km²`
      });
    } else {
      toast.error(`Cidade "${cityName}" não encontrada em ${selectedState}. Verifique o nome e tente novamente.`);
    }
  };

  const handleRemoveFromWishlist = (cityName: string) => {
    setWishlistCities(prev => 
      prev.filter(city => city.properties.nome !== cityName)
    );
    toast.success(`${cityName} removida da lista de desejos`);
  };

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {/* Coluna esquerda - Controles */}
          <div className="lg:col-span-1 space-y-6 overflow-y-auto">
            <StateSelector 
              selectedState={selectedState} 
              onStateSelect={handleStateSelect} 
            />
            <CitySelector 
              selectedState={selectedState} 
              onAddCity={handleAddCity}
              onAddToWishlist={handleAddToWishlist}
            />
            <CityList cities={visitedCities} onRemoveCity={handleRemoveCity} />
            <StatisticsModal cities={visitedCities} />
            <WishlistModal 
              cities={wishlistCities} 
              onRemoveCity={handleRemoveFromWishlist}
            />
          </div>
          
          {/* Coluna direita - Mapa */}
          <div className="lg:col-span-3 min-h-[500px] lg:h-full">
            <MapView cities={visitedCities} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;