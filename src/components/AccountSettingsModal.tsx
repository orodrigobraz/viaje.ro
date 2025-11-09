import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Mail, Lock, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AccountSettingsModal = ({ open, onOpenChange }: AccountSettingsModalProps) => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({
      display_name: displayName || null,
      avatar_url: avatarUrl || null
    });
    setSaving(false);
  };

  const handleUpdateEmail = async () => {
    if (!newEmail) {
      toast.error('Digite um novo email');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success('Email atualizado! Verifique sua caixa de entrada para confirmar.');
      setNewEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar email');
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Senha atualizada com sucesso!');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar senha');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // This requires additional setup on Supabase side
      toast.info('Entre em contato com o suporte para deletar sua conta');
    } catch (error: any) {
      toast.error('Erro ao processar solicitação');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações da Conta</DialogTitle>
          <DialogDescription>
            Gerencie suas informações pessoais e configurações de segurança
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar e Nome */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {displayName ? displayName[0].toUpperCase() : user?.email?.[0].toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar-url">URL do Avatar</Label>
                <Input
                  id="avatar-url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://exemplo.com/avatar.jpg"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="display-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome de Exibição
              </Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
              {saving ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </div>

          {/* Separador */}
          <div className="border-t border-border" />

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="new-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Alterar Email
            </Label>
            <div className="text-sm text-muted-foreground mb-2">
              Email atual: {user?.email}
            </div>
            <div className="flex gap-2">
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="novo@email.com"
              />
              <Button onClick={handleUpdateEmail} variant="secondary">
                Atualizar
              </Button>
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label htmlFor="new-password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Alterar Senha
            </Label>
            <div className="flex gap-2">
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha (mín. 6 caracteres)"
              />
              <Button onClick={handleUpdatePassword} variant="secondary">
                Atualizar
              </Button>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-border" />

          {/* Deletar Conta */}
          <div className="space-y-2">
            <Label className="text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Zona de Perigo
            </Label>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Deletar Conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá permanentemente deletar sua conta
                    e remover todos os seus dados dos nossos servidores.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Deletar Conta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};