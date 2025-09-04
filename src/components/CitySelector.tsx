import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Plus, Building2, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchCitiesByState, CityData } from '@/data/mockData';

interface CitySelectorProps {
  selectedState: string;
  onAddCity: (cityName: string) => void;
  onAddToWishlist: (cityName: string) => void;
}

export const CitySelector = ({ selectedState, onAddCity, onAddToWishlist }: CitySelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState<CityData[]>([]);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    if (selectedState) {
      const cities = searchCitiesByState(selectedState);
      const filtered = cities.filter(city =>
        city.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  }, [selectedState, searchTerm]);

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setOpen(false);
  };

  const handleAddCity = () => {
    if (selectedCity) {
      onAddCity(selectedCity);
      setSelectedCity('');
      setSearchTerm('');
    }
  };

  const handleAddToWishlist = () => {
    if (selectedCity) {
      onAddToWishlist(selectedCity);
      setSelectedCity('');
      setSearchTerm('');
    }
  };

  if (!selectedState) {
    return (
      <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
        <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Primeiro selecione um estado para ver as cidades disponíveis
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="h-4 w-4 text-teal" />
        <h3 className="text-sm font-medium text-foreground">
          Cidades de {selectedState}
        </h3>
      </div>

      <div className="space-y-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between border-border"
            >
              {selectedCity || "Escolha uma cidade..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <div className="flex items-center border-b px-3">
                <Input
                  placeholder="Buscar cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredCities.length > 0) {
                      handleCitySelect(filteredCities[0].nome);
                    }
                  }}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <CommandList>
                <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                <CommandGroup>
                  {filteredCities.map((city) => (
                    <CommandItem
                      key={city.nome}
                      onSelect={() => handleCitySelect(city.nome)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCity === city.nome ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{city.nome}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedCity && (
          <div className="flex gap-3">
            <Button 
              onClick={handleAddCity}
              className="flex-1 bg-success text-success-foreground hover:bg-success/90 transition-colors duration-200 font-medium"
              size="default"
            >
              <Plus className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">Adicionar às Visitadas</span>
            </Button>
            
            <Button 
              onClick={handleAddToWishlist}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
              variant="outline"
              size="icon"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};