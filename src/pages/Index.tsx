import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { StateSelector } from '@/components/StateSelector';
import { CitySelector } from '@/components/CitySelector';
import { MapView } from '@/components/MapView';
import { CityList } from '@/components/CityList';
import { StatisticsModal } from '@/components/StatisticsModal';
import { WishlistModal } from '@/components/WishlistModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCities } from '@/hooks/useCities';
import { searchCity } from '@/data/mockData';
import { toast } from 'sonner';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    visitedCities, 
    wishlistCities, 
    loading: citiesLoading,
    addVisitedCity, 
    removeVisitedCity, 
    addWishlistCity, 
    removeWishlistCity 
  } = useCities();
  
  const [selectedState, setSelectedState] = useState<string>('');
  const navigate = useNavigate();

  const handleAddCity = async (cityName: string) => {
    if (!user) {
      toast.error('Faça login para salvar suas cidades visitadas');
      return;
    }

    // Buscar cidade exata por nome e estado selecionado
    const foundCity = searchCity(cityName, selectedState);
    
    if (foundCity) {
      const success = await addVisitedCity(
        foundCity.properties.nome, 
        foundCity.properties.estado, 
        foundCity.properties.area
      );
      
      if (success) {
        toast.success(`${foundCity.properties.nome} adicionada com sucesso!`, {
          description: `${foundCity.properties.estado} • ${foundCity.properties.area.toLocaleString('pt-BR')} km²`
        });
      }
    } else {
      toast.error(`Cidade "${cityName}" não encontrada em ${selectedState}. Verifique o nome e tente novamente.`);
    }
  };

  const handleRemoveCity = async (cityName: string) => {
    const success = await removeVisitedCity(cityName);
    if (success) {
      toast.success(`${cityName} removida da lista`);
    }
  };

  const handleAddToWishlist = async (cityName: string) => {
    if (!user) {
      toast.error('Faça login para salvar sua lista de desejos');
      return;
    }

    // Buscar cidade exata por nome e estado selecionado
    const foundCity = searchCity(cityName, selectedState);
    
    if (foundCity) {
      const success = await addWishlistCity(
        foundCity.properties.nome, 
        foundCity.properties.estado, 
        foundCity.properties.area
      );
      
      if (success) {
        toast.success(`${foundCity.properties.nome} adicionada à lista de desejos!`, {
          description: `${foundCity.properties.estado} • ${foundCity.properties.area.toLocaleString('pt-BR')} km²`
        });
      }
    } else {
      toast.error(`Cidade "${cityName}" não encontrada em ${selectedState}. Verifique o nome e tente novamente.`);
    }
  };

  const handleRemoveFromWishlist = async (cityName: string) => {
    const success = await removeWishlistCity(cityName);
    if (success) {
      toast.success(`${cityName} removida da lista de desejos`);
    }
  };

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
  };

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  // Mostrar tela de login se não estiver autenticado
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6 text-center space-y-4">
                <LogIn className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <h2 className="text-xl font-semibold mb-2">Bem-vindo ao Viajero</h2>
                  <p className="text-muted-foreground mb-4">
                    Faça login para salvar suas cidades visitadas e criar sua lista de desejos
                  </p>
                </div>
                <Button onClick={() => navigate('/auth')} className="w-full">
                  Fazer Login / Cadastro
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

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