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
import { LogIn, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 relative overflow-hidden">
        {/* Mapa - Ocupa toda a tela */}
        <div className="absolute inset-0 z-0">
          <MapView cities={visitedCities} />
        </div>
        
        {/* Sidebar flutuante - Por cima do mapa */}
        <div 
          className={`absolute top-0 left-0 h-full border-r border-border bg-background shadow-2xl overflow-y-auto transition-all duration-300 ease-in-out z-50 ${
            sidebarOpen ? 'w-80 p-4' : 'w-0 p-0 border-r-0'
          }`}
        >
          {sidebarOpen && (
            <div className="min-h-full flex flex-col">
              <div className="space-y-4">
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
              
              {/* Footer no final do conteúdo */}
              <footer className="mt-auto pt-8 pb-4 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Desenvolvido de &hearts; por{' '}
                  <a 
                    href="https://orodrigobraz.github.io/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Rodrigo Braz
                  </a>
                </p>
              </footer>
            </div>
          )}
        </div>
      </main>
      
      {/* Botão para toggle do sidebar - Fixed position */}
      <Button
        variant="default"
        size="icon"
        className="fixed top-1/2 -translate-y-1/2 z-[9999] transition-all duration-300 ease-in-out shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center rounded-full border-2 border-primary/20 w-14 h-14 p-0"
        style={{ 
          left: sidebarOpen ? '21rem' : '1rem'
        }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? (
          <ChevronLeft 
            className="text-white" 
            size={32} 
            strokeWidth={5}
          />
        ) : (
          <ChevronRight 
            className="text-white" 
            size={32} 
            strokeWidth={5}
          />
        )}
      </Button>
    </div>
  );
};

export default Index;