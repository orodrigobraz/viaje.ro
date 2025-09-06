import { Compass, LogOut, User } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const Header = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

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
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4" />
                <span className="text-muted-foreground">{user.email}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 border-border hover:bg-accent"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            )}
            <SettingsModal />
          </div>
        </div>
      </div>
    </header>
  );
};