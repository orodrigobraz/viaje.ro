import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchStates } from '@/data/mockData';

interface StateSelectorProps {
  selectedState: string;
  onStateSelect: (state: string) => void;
}

export const StateSelector = ({ selectedState, onStateSelect }: StateSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStates, setFilteredStates] = useState<string[]>([]);

  useEffect(() => {
    const states = searchStates(searchTerm);
    setFilteredStates(states);
  }, [searchTerm]);

  const handleStateSelect = (state: string) => {
    onStateSelect(state);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">Selecione um Estado</h3>
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between border-border"
          >
            {selectedState || "Escolha um estado..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
              <div className="flex items-center border-b px-3">
                <Input
                  placeholder="Buscar estado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredStates.length > 0) {
                      handleStateSelect(filteredStates[0]);
                    }
                  }}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            <CommandList>
              <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
              <CommandGroup>
                {filteredStates.map((state) => (
                  <CommandItem
                    key={state}
                    onSelect={() => handleStateSelect(state)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedState === state ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {state}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};