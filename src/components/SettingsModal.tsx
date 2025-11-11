import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Palette, RotateCcw, Heart, Moon, Sun, Save } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from './ThemeProvider';
import { statesData } from '@/data/mockData';

const colorOptions = [
  { value: '#ff7800', label: 'Laranja' },
  { value: '#0ea5e9', label: 'Azul Claro' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Amarelo' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#84cc16', label: 'Lima' },
  { value: '#f97316', label: 'Laranja Escuro' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#6366f1', label: 'Índigo' },
  { value: '#14b8a6', label: 'Verde Água' },
  { value: '#a855f7', label: 'Violeta' },
  { value: '#22c55e', label: 'Verde Claro' },
  { value: '#fb7185', label: 'Rosa Claro' },
  { value: '#fbbf24', label: 'Âmbar' },
  { value: '#f43f5e', label: 'Vermelho Rosa' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#64748b', label: 'Cinza' },
  { value: '#737373', label: 'Cinza Neutro' }
];

interface SettingsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SettingsModal = ({ open: controlledOpen, onOpenChange: controlledOnOpenChange }: SettingsModalProps = {}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { stateColors, wishlistColor, setStateColor, setWishlistColor, resetStateColors, saveSettings, isSaving, hasUnsavedChanges } = useSettings();
  const { theme, setTheme } = useTheme();

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;

  const handleSave = async () => {
    await saveSettings();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="border-border hover:bg-accent"
          >
            <Settings className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Configurações</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[85vh] bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configurações do Mapa
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            {/* Cor da Lista de Desejos */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold">Cor da Lista de Desejos</h3>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-border"
                    style={{ backgroundColor: wishlistColor }}
                  />
                  <span className="font-medium">Contorno das Cidades na Lista de Desejos</span>
                </div>
                
                <Select value={wishlistColor} onValueChange={setWishlistColor}>
                  <SelectTrigger className="w-[140px] h-9 border-2 border-primary/30 hover:border-primary/50 bg-background shadow-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-5 h-5 rounded-full border-2 border-border shadow-sm"
                        style={{ backgroundColor: wishlistColor }}
                      />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-[9999]">
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-5 h-5 rounded-full border-2 border-border"
                            style={{ backgroundColor: color.value }}
                          />
                          <span className="text-sm">{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tema */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sun className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold">Tema</h3>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-primary" />
                  )}
                  <span className="font-medium">Modo {theme === "dark" ? "Escuro" : "Claro"}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="flex items-center gap-2"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4" />
                      Claro
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" />
                      Escuro
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Cores dos Estados */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold">Cores dos Estados</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetStateColors}
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Resetar
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {statesData.map((estado) => (
                  <div key={estado.estado} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div 
                        className="w-4 h-4 rounded-full border border-border flex-shrink-0"
                        style={{ backgroundColor: stateColors[estado.estado] || '#ff7800' }}
                      />
                      <span className="font-medium text-sm truncate">{estado.estado}</span>
                    </div>
                    
                    <Select 
                      value={stateColors[estado.estado] || '#ff7800'} 
                      onValueChange={(color) => setStateColor(estado.estado, color)}
                    >
                      <SelectTrigger className="w-[100px] h-9 border-2 border-primary/30 hover:border-primary/50 bg-background shadow-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-5 h-5 rounded-full border-2 border-border shadow-sm"
                            style={{ backgroundColor: stateColors[estado.estado] || '#ff7800' }}
                          />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border z-[9999]">
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-5 h-5 rounded-full border-2 border-border"
                                style={{ backgroundColor: color.value }}
                              />
                              <span className="text-sm">{color.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Dica:</strong> As cores selecionadas serão aplicadas aos contornos territoriais das cidades de cada estado no mapa principal. A cor da lista de desejos será aplicada especificamente no mapa da lista de desejos.
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-border pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};