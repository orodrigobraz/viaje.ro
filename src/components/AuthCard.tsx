import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, User, Eye, EyeOff, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { AUTH_REDIRECT_URL, RESET_PASSWORD_REDIRECT_URL } from '@/lib/authUrls';

const passwordSchema = z.string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[0-9]/, 'A senha deve conter pelo menos 1 número')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos 1 letra maiúscula')
  .regex(/[!@#$%&*?=\-_+]/, 'A senha deve conter pelo menos 1 caractere especial (!@#$%&*?=-_+)');

interface AuthCardProps {
  onLoginSuccess?: () => void;
  showBackLink?: boolean;
}

interface EmailFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

const EmailField = ({ id, value, onChange }: EmailFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>Email</Label>
    <div className="relative">
      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        id={id}
        type="email"
        placeholder="seu@email.com"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
        required
        autoComplete="email"
      />
    </div>
  </div>
);

interface PasswordFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  autoComplete: string;
}

const PasswordField = ({
  id,
  value,
  onChange,
  showPassword,
  onToggleShowPassword,
  autoComplete,
}: PasswordFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>Senha</Label>
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10"
        required
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={onToggleShowPassword}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </div>
);

interface PasswordRequirementsProps {
  requirements: {
    minLength: boolean;
    hasNumber: boolean;
    hasUppercase: boolean;
    hasSpecialChar: boolean;
  };
}

const PasswordRequirements = ({ requirements }: PasswordRequirementsProps) => (
  <div className="space-y-1 px-2 py-2 bg-muted/50 rounded-md">
    <p className="text-xs font-medium mb-2">Requisitos da senha:</p>
    <div className="space-y-1">
      {[
        { met: requirements.minLength, label: 'Mínimo 8 caracteres' },
        { met: requirements.hasNumber, label: 'Pelo menos 1 número' },
        { met: requirements.hasUppercase, label: 'Pelo menos 1 letra maiúscula' },
        { met: requirements.hasSpecialChar, label: 'Pelo menos 1 caractere especial (!@#$%&*?=-_+)' },
      ].map(({ met, label }) => (
        <div key={label} className="flex items-center gap-2 text-xs">
          {met ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <X className="h-3 w-3 text-muted-foreground" />
          )}
          <span className={met ? 'line-through text-muted-foreground' : ''}>{label}</span>
        </div>
      ))}
    </div>
  </div>
);

const AuthCard = ({ onLoginSuccess, showBackLink = false }: AuthCardProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasNumber: false,
    hasUppercase: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    if (password) {
      setPasswordRequirements({
        minLength: password.length >= 8,
        hasNumber: /[0-9]/.test(password),
        hasUppercase: /[A-Z]/.test(password),
        hasSpecialChar: /[!@#$%&*?=\-_+]/.test(password),
      });
    } else {
      setPasswordRequirements({
        minLength: false,
        hasNumber: false,
        hasUppercase: false,
        hasSpecialChar: false,
      });
    }
  }, [password]);

  const handleEmailAuth = async (e: React.FormEvent, signUp: boolean) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (signUp) {
        try {
          passwordSchema.parse(password);
        } catch (error: unknown) {
          if (error instanceof z.ZodError) {
            toast.error(error.errors[0].message);
            setLoading(false);
            return;
          }
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: AUTH_REDIRECT_URL,
            data: { name: displayName },
          },
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error('Este email já está cadastrado. Faça login ou use outro email.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Conta criada! Verifique seu email para confirmar o cadastro.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email ou senha incorretos');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Login realizado com sucesso!');
          onLoginSuccess?.();
        }
      }
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('Informe seu email');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: RESET_PASSWORD_REDIRECT_URL,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(
          'Se esse email estiver cadastrado, você receberá um link para redefinir a senha.'
        );
        setIsForgotPassword(false);
      }
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const switchToLogin = () => {
    setIsSignUp(false);
    setIsForgotPassword(false);
  };

  const switchToSignUp = () => {
    setIsSignUp(true);
    setIsForgotPassword(false);
  };

  return (
    <Card className="w-full max-w-md relative z-10 bg-background/95 backdrop-blur-sm overflow-hidden">
      {isForgotPassword ? (
        <>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Recuperar senha</CardTitle>
            <CardDescription className="text-center">
              Informe o email da sua conta. Enviaremos um link para criar uma nova senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <EmailField id="email-forgot" value={email} onChange={setEmail} />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
            </form>
            <div className="text-center space-y-2">
              <Button type="button" variant="link" onClick={switchToLogin} className="text-sm">
                Voltar ao login
              </Button>
              {showBackLink && (
                <div className="text-xs text-muted-foreground">
                  <Link to="/" className="hover:underline">Voltar ao início</Link>
                </div>
              )}
            </div>
          </CardContent>
        </>
      ) : (
        <>
          <div className="overflow-hidden">
            <div
              className="flex w-[200%] transition-transform duration-500 ease-in-out"
              style={{ transform: isSignUp ? 'translateX(-50%)' : 'translateX(0)' }}
            >
              {/* Painel de Login */}
              <div className="w-1/2 shrink-0">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-center">Entrar</CardTitle>
                  <CardDescription className="text-center">
                    Entre com sua conta para acessar suas cidades
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Faça login para continuar
                      </span>
                    </div>
                  </div>
                  <form onSubmit={(e) => handleEmailAuth(e, false)} className="space-y-4">
                    <EmailField id="email-login" value={email} onChange={setEmail} />
                    <PasswordField
                      id="password-login"
                      value={password}
                      onChange={setPassword}
                      showPassword={showPassword}
                      onToggleShowPassword={() => setShowPassword((prev) => !prev)}
                      autoComplete="current-password"
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && !isSignUp ? 'Carregando...' : 'Entrar'}
                    </Button>
                  </form>
                  <div className="text-center space-y-2">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm block w-full"
                    >
                      Esqueci minha senha
                    </Button>
                    <Button type="button" variant="link" onClick={switchToSignUp} className="text-sm">
                      Não tem uma conta? Cadastre-se
                    </Button>
                    {showBackLink && (
                      <div className="text-xs text-muted-foreground">
                        <Link to="/" className="hover:underline">Voltar ao início</Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              {/* Painel de Cadastro */}
              <div className="w-1/2 shrink-0">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
                  <CardDescription className="text-center">
                    Crie sua conta para salvar suas cidades visitadas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Cadastre-se para continuar
                      </span>
                    </div>
                  </div>
                  <form onSubmit={(e) => handleEmailAuth(e, true)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Nome</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="displayName"
                          type="text"
                          placeholder="Seu nome"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <EmailField id="email-signup" value={email} onChange={setEmail} />
                    <div className="space-y-2">
                      <PasswordField
                        id="password-signup"
                        value={password}
                        onChange={setPassword}
                        showPassword={showPassword}
                        onToggleShowPassword={() => setShowPassword((prev) => !prev)}
                        autoComplete="new-password"
                      />
                      {password && <PasswordRequirements requirements={passwordRequirements} />}
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && isSignUp ? 'Carregando...' : 'Criar Conta'}
                    </Button>
                  </form>
                  <div className="text-center space-y-2">
                    <Button type="button" variant="link" onClick={switchToLogin} className="text-sm">
                      Já tem uma conta? Faça login
                    </Button>
                    {showBackLink && (
                      <div className="text-xs text-muted-foreground">
                        <Link to="/" className="hover:underline">Voltar ao início</Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default AuthCard;
