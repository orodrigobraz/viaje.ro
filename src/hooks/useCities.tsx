import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { City } from '@/data/mockData';
import { toast } from 'sonner';

export const useCities = () => {
  const { user } = useAuth();
  const [visitedCities, setVisitedCities] = useState<City[]>([]);
  const [wishlistCities, setWishlistCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar cidades visitadas do Supabase
  const loadVisitedCities = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('visited_cities')
        .select('*')
        .eq('user_id', user.id)
        .order('visited_at', { ascending: false });

      if (error) throw error;

      const cities: City[] = data.map(item => ({
        properties: {
          nome: item.city_name,
          area: item.area_km2 || 0,
          estado: item.state_name
        },
        geometry: {
          type: "Point",
          coordinates: []
        }
      }));

      setVisitedCities(cities);
    } catch (error) {
      console.error('Erro ao carregar cidades visitadas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar lista de desejos do Supabase
  const loadWishlistCities = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist_cities')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;

      const cities: City[] = data.map(item => ({
        properties: {
          nome: item.city_name,
          area: item.area_km2 || 0,
          estado: item.state_name
        },
        geometry: {
          type: "Point",
          coordinates: []
        }
      }));

      setWishlistCities(cities);
    } catch (error) {
      console.error('Erro ao carregar lista de desejos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar cidade visitada
  const addVisitedCity = async (cityName: string, stateName: string, area: number) => {
    if (!user) {
      toast.error('Faça login para salvar suas cidades visitadas');
      return false;
    }

    try {
      const { error } = await supabase
        .from('visited_cities')
        .insert({
          user_id: user.id,
          city_name: cityName,
          state_name: stateName,
          state_abbreviation: '', // Pode ser populado depois
          area_km2: area
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error(`${cityName} já foi adicionada à sua lista`);
        } else {
          throw error;
        }
        return false;
      }

      await loadVisitedCities();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar cidade visitada:', error);
      toast.error('Erro ao adicionar cidade');
      return false;
    }
  };

  // Remover cidade visitada
  const removeVisitedCity = async (cityName: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('visited_cities')
        .delete()
        .eq('user_id', user.id)
        .eq('city_name', cityName);

      if (error) throw error;

      await loadVisitedCities();
      return true;
    } catch (error) {
      console.error('Erro ao remover cidade visitada:', error);
      toast.error('Erro ao remover cidade');
      return false;
    }
  };

  // Adicionar à lista de desejos
  const addWishlistCity = async (cityName: string, stateName: string, area: number) => {
    if (!user) {
      toast.error('Faça login para salvar sua lista de desejos');
      return false;
    }

    try {
      const { error } = await supabase
        .from('wishlist_cities')
        .insert({
          user_id: user.id,
          city_name: cityName,
          state_name: stateName,
          state_abbreviation: '', // Pode ser populado depois
          area_km2: area
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error(`${cityName} já está na sua lista de desejos`);
        } else {
          throw error;
        }
        return false;
      }

      await loadWishlistCities();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar à lista de desejos:', error);
      toast.error('Erro ao adicionar à lista de desejos');
      return false;
    }
  };

  // Remover da lista de desejos
  const removeWishlistCity = async (cityName: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('wishlist_cities')
        .delete()
        .eq('user_id', user.id)
        .eq('city_name', cityName);

      if (error) throw error;

      await loadWishlistCities();
      return true;
    } catch (error) {
      console.error('Erro ao remover da lista de desejos:', error);
      toast.error('Erro ao remover da lista de desejos');
      return false;
    }
  };

  // Carregar dados quando o usuário mudar
  useEffect(() => {
    if (user) {
      loadVisitedCities();
      loadWishlistCities();
    } else {
      setVisitedCities([]);
      setWishlistCities([]);
    }
  }, [user]);

  return {
    visitedCities,
    wishlistCities,
    loading,
    addVisitedCity,
    removeVisitedCity,
    addWishlistCity,
    removeWishlistCity,
    loadVisitedCities,
    loadWishlistCities
  };
};