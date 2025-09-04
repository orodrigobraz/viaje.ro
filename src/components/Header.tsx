import { Compass } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { SettingsModal } from './SettingsModal';

export const Header = () => {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-teal/20 rounded-lg">
              <Compass className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
                Viaje.ro
              </h1>
              <p className="text-sm text-muted-foreground">
                Descubra e registre suas aventuras pelo Brasil
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <SettingsModal />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};