import React, { createContext, useContext, useState, ReactNode } from 'react';

interface StateColors {
  [stateName: string]: string;
}

interface SettingsContextType {
  stateColors: StateColors;
  wishlistColor: string;
  setStateColor: (state: string, color: string) => void;
  setWishlistColor: (color: string) => void;
  resetStateColors: () => void;
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
  const [stateColors, setStateColors] = useState<StateColors>(() => {
    const saved = localStorage.getItem('viajero-state-colors');
    return saved ? JSON.parse(saved) : defaultStateColors;
  });

  const [wishlistColor, setWishlistColorState] = useState<string>(() => {
    const saved = localStorage.getItem('viajero-wishlist-color');
    return saved || '#ef4444';
  });

  const setStateColor = (state: string, color: string) => {
    const newColors = { ...stateColors, [state]: color };
    setStateColors(newColors);
    localStorage.setItem('viajero-state-colors', JSON.stringify(newColors));
  };

  const setWishlistColor = (color: string) => {
    setWishlistColorState(color);
    localStorage.setItem('viajero-wishlist-color', color);
  };

  const resetStateColors = () => {
    setStateColors(defaultStateColors);
    localStorage.setItem('viajero-state-colors', JSON.stringify(defaultStateColors));
  };

  return (
    <SettingsContext.Provider value={{ 
      stateColors, 
      wishlistColor,
      setStateColor, 
      setWishlistColor,
      resetStateColors 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};