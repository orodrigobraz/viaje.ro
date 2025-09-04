import { citiesData, CityData } from './mockData';

export const getCityData = (cityName: string, stateName: string): CityData | null => {
  const found = citiesData.find(city => 
    city.nome.toLowerCase() === cityName.toLowerCase() && 
    city.estado.toLowerCase() === stateName.toLowerCase()
  );
  return found || null;
};