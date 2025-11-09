import { Compass, LogOut, User, Settings, MapPin } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { AccountSettingsModal } from './AccountSettingsModal';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { useState } from 'react';

export const Header = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [mapSettingsOpen, setMapSettingsOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Usuário';

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
            {user && (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {displayName[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground hidden sm:inline">
                    {displayName}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2"
                        onClick={() => setMapSettingsOpen(true)}
                      >
                        <MapPin className="h-4 w-4" />
                        Configurações do Mapa
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2"
                        onClick={() => setAccountSettingsOpen(true)}
                      >
                        <User className="h-4 w-4" />
                        Configurações da Conta
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>
          
          <SettingsModal open={mapSettingsOpen} onOpenChange={setMapSettingsOpen} />
          <AccountSettingsModal open={accountSettingsOpen} onOpenChange={setAccountSettingsOpen} />
        </div>
      </div>
    </header>
  );
};