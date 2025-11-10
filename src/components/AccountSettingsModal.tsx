import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Mail, Lock, Trash2, Upload, Check, X, Eye, EyeOff } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[0-9]/, 'A senha deve conter pelo menos 1 número')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos 1 letra maiúscula')
  .regex(/[!@#$%&*?=\-_+]/, 'A senha deve conter pelo menos 1 caractere especial (!@#$%&*?=-_+)');

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated?: () => void;
}

export const AccountSettingsModal = ({ open, onOpenChange, onProfileUpdated }: AccountSettingsModalProps) => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password requirements state
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasNumber: false,
    hasUppercase: false,
    hasSpecialChar: false
  });

  // Update avatar URL when profile changes
  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  // Validate email in real-time
  useEffect(() => {
    if (newEmail || confirmEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (newEmail && !emailRegex.test(newEmail)) {
        setEmailError('Email inválido');
      } else if (confirmEmail && newEmail !== confirmEmail) {
        setEmailError('Os emails não coincidem');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }, [newEmail, confirmEmail]);

  // Validate password requirements in real-time
  useEffect(() => {
    if (newPassword) {
      setPasswordRequirements({
        minLength: newPassword.length >= 8,
        hasNumber: /[0-9]/.test(newPassword),
        hasUppercase: /[A-Z]/.test(newPassword),
        hasSpecialChar: /[!@#$%&*?=\-_+]/.test(newPassword)
      });
    } else {
      setPasswordRequirements({
        minLength: false,
        hasNumber: false,
        hasUppercase: false,
        hasSpecialChar: false
      });
    }
  }, [newPassword]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      await updateProfile({ avatar_url: publicUrl });
      toast.success('Avatar atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer upload do avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({
      display_name: displayName || null,
    });
    setSaving(false);
    onProfileUpdated?.();
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !confirmEmail) {
      toast.error('Preencha ambos os campos de email');
      return;
    }

    if (newEmail !== confirmEmail) {
      toast.error('Os emails não coincidem');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Email inválido');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success('Email atualizado! Verifique sua caixa de entrada para confirmar.');
      setNewEmail('');
      setConfirmEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar email');
    }
  };

  const handleCurrentPasswordBlur = async () => {
    if (!currentPassword) {
      setCurrentPasswordError('');
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });

      if (signInError) {
        setCurrentPasswordError('Senha incorreta');
      } else {
        setCurrentPasswordError('');
      }
    } catch (error) {
      setCurrentPasswordError('Erro ao verificar senha');
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos de senha');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    try {
      passwordSchema.parse(newPassword);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    try {
      // Verificar senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });

      if (signInError) {
        setCurrentPasswordError('Senha atual incorreta');
        toast.error('Senha atual incorreta');
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPasswordError('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar senha');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteEmail || !deletePassword) {
      toast.error('Preencha o email e a senha para confirmar');
      return;
    }

    if (deleteEmail !== user?.email) {
      toast.error('O email não corresponde ao da sua conta');
      return;
    }

    try {
      // Verificar credenciais
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: deleteEmail,
        password: deletePassword
      });

      if (signInError) {
        toast.error('Email ou senha incorretos');
        return;
      }

      // Deletar conta (requer setup adicional no Supabase)
      toast.info('Entre em contato com o suporte para deletar sua conta');
      setShowDeleteDialog(false);
      setDeleteEmail('');
      setDeletePassword('');
    } catch (error: any) {
      toast.error('Erro ao processar solicitação');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle>Configurações da Conta</DialogTitle>
          <DialogDescription>
            Gerencie suas informações pessoais e configurações de segurança
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Avatar e Nome */}
          <div className="space-y-4 p-4 rounded-lg bg-primary/10 dark:bg-primary/20 border-2 border-primary/20 dark:border-primary/30">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {displayName ? displayName[0].toUpperCase() : user?.email?.[0].toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Label htmlFor="avatar-upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload de Avatar
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Tamanho máximo: 2MB. Formatos: JPG, PNG, WEBP
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="display-name" className="flex items-center gap-2 mb-2">
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

            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </div>

          {/* Email */}
          <div className="space-y-2 p-4 rounded-lg bg-blue-100 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-700">
            <Label htmlFor="new-email" className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4" />
              Alterar Email
            </Label>
            <div className="text-sm text-muted-foreground mb-2">
              Email atual: {user?.email}
            </div>
            <div className="space-y-2">
              <div>
                <Label htmlFor="new-email" className="text-sm mb-1.5 block">Novo email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Novo email"
                  className={emailError && newEmail ? 'border-destructive' : ''}
                />
              </div>
              <div>
                <Label htmlFor="confirm-email" className="text-sm mb-1.5 block">Confirmar novo email</Label>
                <Input
                  id="confirm-email"
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="Confirmar novo email"
                  className={emailError && confirmEmail ? 'border-destructive' : ''}
                />
                {emailError && (newEmail || confirmEmail) && (
                  <p className="text-xs text-destructive mt-1">{emailError}</p>
                )}
              </div>
              <Button 
                onClick={handleUpdateEmail} 
                variant="secondary"
                disabled={!!emailError || !newEmail || !confirmEmail}
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                Atualizar Email
              </Button>
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-2 p-4 rounded-lg bg-amber-100 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700">
            <Label htmlFor="current-password" className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4" />
              Alterar Senha
            </Label>
            <div className="space-y-3">
              <div>
                <Label htmlFor="current-password" className="text-sm mb-1.5 block">Senha atual</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setCurrentPasswordError('');
                  }}
                  onBlur={handleCurrentPasswordBlur}
                  placeholder="Senha atual"
                  className={currentPasswordError ? 'border-destructive' : ''}
                />
                {currentPasswordError && (
                  <p className="text-xs text-destructive mt-1">{currentPasswordError}</p>
                )}
              </div>
              <div>
                <Label htmlFor="new-password" className="text-sm mb-1.5 block">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Password Requirements Checklist */}
              {newPassword && (
                <div className="space-y-1 px-2 py-2 bg-muted/50 rounded-md">
                  <p className="text-xs font-medium mb-2">Requisitos da senha:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      {passwordRequirements.minLength ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={passwordRequirements.minLength ? 'line-through text-muted-foreground' : ''}>
                        Mínimo 8 caracteres
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordRequirements.hasNumber ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={passwordRequirements.hasNumber ? 'line-through text-muted-foreground' : ''}>
                        Pelo menos 1 número
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordRequirements.hasUppercase ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={passwordRequirements.hasUppercase ? 'line-through text-muted-foreground' : ''}>
                        Pelo menos 1 letra maiúscula
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordRequirements.hasSpecialChar ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={passwordRequirements.hasSpecialChar ? 'line-through text-muted-foreground' : ''}>
                        Pelo menos 1 caractere especial (!@#$%&*?=-_+)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="confirm-password" className="text-sm mb-1.5 block">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar nova senha"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive mt-1">As senhas não coincidem</p>
              )}
              <Button 
                onClick={handleUpdatePassword} 
                variant="secondary"
                disabled={
                  !currentPassword || 
                  !!currentPasswordError || 
                  !newPassword || 
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  !passwordRequirements.minLength ||
                  !passwordRequirements.hasNumber ||
                  !passwordRequirements.hasUppercase ||
                  !passwordRequirements.hasSpecialChar
                }
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                Atualizar Senha
              </Button>
            </div>
          </div>

          {/* Deletar Conta */}
          <div className="space-y-2 p-4 rounded-lg bg-destructive/10 dark:bg-destructive/20 border-2 border-destructive/30 dark:border-destructive/40">
            <Label className="text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Zona de Perigo
            </Label>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setShowDeleteDialog(true)}
              >
                Deletar Conta
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirme a exclusão da conta</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Para confirmar, digite seu email e senha abaixo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-email">Email</Label>
                    <Input
                      id="delete-email"
                      type="email"
                      value={deleteEmail}
                      onChange={(e) => setDeleteEmail(e.target.value)}
                      placeholder={user?.email}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delete-password">Senha</Label>
                    <Input
                      id="delete-password"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Sua senha"
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                    setDeleteEmail('');
                    setDeletePassword('');
                  }}>Cancelar</AlertDialogCancel>
                  <Button 
                    onClick={handleDeleteAccount} 
                    variant="destructive"
                  >
                    Deletar Conta Permanentemente
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};