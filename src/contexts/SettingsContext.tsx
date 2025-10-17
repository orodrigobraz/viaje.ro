import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface StateColors {
  [stateName: string]: string;
}

interface SettingsContextType {
  stateColors: StateColors;
  wishlistColor: string;
  setStateColor: (state: string, color: string) => void;
  setWishlistColor: (color: string) => void;
  resetStateColors: () => void;
  saveSettings: () => Promise<void>;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

const defaultStateColors: StateColors = {
  'Acre': '#ff7800',
  'Alagoas': '#0ea5e9',
  'Amapá': '#10b981',
  'Amazonas': '#f59e0b',
  'Bahia': '#ef4444',
  'Ceará': '#8b5cf6',
  'Distrito Federal': '#06b6d4',
  'Espírito Santo': '#84cc16',
  'Goiás': '#f97316',
  'Maranhão': '#ec4899',
  'Mato Grosso': '#6366f1',
  'Mato Grosso do Sul': '#14b8a6',
  'Minas Gerais': '#a855f7',
  'Pará': '#22c55e',
  'Paraíba': '#fb7185',
  'Paraná': '#fbbf24',
  'Pernambuco': '#06b6d4',
  'Piauí': '#f43f5e',
  'Rio de Janeiro': '#3b82f6',
  'Rio Grande do Norte': '#8b5cf6',
  'Rio Grande do Sul': '#10b981',
  'Rondônia': '#f59e0b',
  'Roraima': '#ef4444',
  'Santa Catarina': '#06b6d4',
  'São Paulo': '#8b5cf6',
  'Sergipe': '#22c55e',
  'Tocantins': '#f97316'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const { user } = useAuth();
  const [stateColors, setStateColors] = useState<StateColors>(defaultStateColors);
  const [wishlistColor, setWishlistColorState] = useState<string>('#ef4444');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialStateColors, setInitialStateColors] = useState<StateColors>(defaultStateColors);
  const [initialWishlistColor, setInitialWishlistColor] = useState<string>('#ef4444');

  // Carregar configurações do banco quando o usuário faz login
  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      // Se não houver usuário, usa as cores padrão
      setStateColors(defaultStateColors);
      setWishlistColorState('#ef4444');
      setInitialStateColors(defaultStateColors);
      setInitialWishlistColor('#ef4444');
      setHasUnsavedChanges(false);
    }
  }, [user]);

  // Auto-salvamento desabilitado - só salva quando o usuário clicar no botão

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('state_colors, wishlist_color')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const loadedStateColors = data.state_colors as StateColors || defaultStateColors;
        const loadedWishlistColor = data.wishlist_color || '#ef4444';
        
        setStateColors(loadedStateColors);
        setWishlistColorState(loadedWishlistColor);
        setInitialStateColors(loadedStateColors);
        setInitialWishlistColor(loadedWishlistColor);
      } else {
        // Se não houver configurações salvas, usa as padrões
        setStateColors(defaultStateColors);
        setWishlistColorState('#ef4444');
        setInitialStateColors(defaultStateColors);
        setInitialWishlistColor('#ef4444');
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar suas configurações');
    }
  };

  const setStateColor = (state: string, color: string) => {
    const newColors = { ...stateColors, [state]: color };
    setStateColors(newColors);
    setHasUnsavedChanges(true);
  };

  const setWishlistColor = (color: string) => {
    setWishlistColorState(color);
    setHasUnsavedChanges(true);
  };

  const resetStateColors = () => {
    setStateColors(defaultStateColors);
    setHasUnsavedChanges(true);
  };

  const saveSettings = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para salvar as configurações');
      return;
    }

    if (!hasUnsavedChanges) {
      return; // Não há mudanças para salvar
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          state_colors: stateColors,
          wishlist_color: wishlistColor,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setInitialStateColors(stateColors);
      setInitialWishlistColor(wishlistColor);
      setHasUnsavedChanges(false);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar as configurações');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      stateColors, 
      wishlistColor,
      setStateColor, 
      setWishlistColor,
      resetStateColors,
      saveSettings,
      isSaving,
      hasUnsavedChanges
    }}>
      {children}
    </SettingsContext.Provider>
  );
};