import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface SearchBarProps {
  onAddCity: (cityName: string) => void;
}

export const SearchBar = ({ onAddCity }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      toast.error('Digite o nome de uma cidade');
      return;
    }

    onAddCity(searchTerm.trim());
    setSearchTerm('');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Digite o nome da cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-border focus:ring-primary"
          />
        </div>
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </form>
    </div>
  );
};