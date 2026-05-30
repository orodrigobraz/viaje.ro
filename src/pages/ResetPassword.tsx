import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import AnimatedBackground from '@/components/AnimatedBackground';

const passwordSchema = z.string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[0-9]/, 'A senha deve conter pelo menos 1 número')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos 1 letra maiúscula')
  .regex(/[!@#$%&*?=\-_+]/, 'A senha deve conter pelo menos 1 caractere especial (!@#$%&*?=-_+)');

type PageStatus = 'loading' | 'ready' | 'invalid';

/** Limpa tokens da URL após o Supabase processar o link do e-mail. */
const cleanAuthParamsFromUrl = () => {
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  useEffect(() => {
    let mounted = true;
    let resolved = false;

    const markReady = () => {
      if (!mounted || resolved) return;
      resolved = true;
      setStatus('ready');
      setErrorMessage(null);
    };

    const markInvalid = (message?: string) => {
      if (!mounted || resolved) return;
      resolved = true;
      setStatus('invalid');
      setErrorMessage(message ?? null);
    };

    const establishRecoverySession = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.slice(1));

      const authError =
        searchParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error');

      if (authError) {
        markInvalid(decodeURIComponent(authError.replace(/\+/g, ' ')));
        cleanAuthParamsFromUrl();
        return;
      }

      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        cleanAuthParamsFromUrl();
        if (error) {
          markInvalid(error.message);
          return;
        }
        markReady();
        return;
      }

      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') ?? hashParams.get('type');
      if (tokenHash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });
        cleanAuthParamsFromUrl();
        if (error) {
          markInvalid(error.message);
          return;
        }
        markReady();
        return;
      }

      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        cleanAuthParamsFromUrl();
        if (error) {
          markInvalid(error.message);
          return;
        }
        markReady();
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        markReady();
        return;
      }

      const hasPendingAuth =
        !!code ||
        !!tokenHash ||
        type === 'recovery' ||
        !!accessToken ||
        hashParams.get('type') === 'recovery';

      if (!hasPendingAuth) {
        markInvalid();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;

      if (
        event === 'PASSWORD_RECOVERY' ||
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED'
      ) {
        markReady();
        cleanAuthParamsFromUrl();
      }
    });

    establishRecoverySession();

    const timeout = window.setTimeout(() => {
      if (mounted && !resolved) {
        markInvalid('Não foi possível validar o link. Solicite um novo e-mail de recuperação.');
      }
    }, 10000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    try {
      passwordSchema.parse(password);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Senha redefinida com sucesso!');
        navigate('/');
      }
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AnimatedBackground />
      <Card className="w-full max-w-md relative z-10 bg-background/95 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Nova senha</CardTitle>
          <CardDescription className="text-center">
            {status === 'loading' && 'Validando link de recuperação...'}
            {status === 'ready' && 'Defina uma nova senha para sua conta'}
            {status === 'invalid' && 'Este link é inválido ou já expirou'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'loading' && (
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Aguarde...
            </p>
          )}

          {status === 'invalid' && (
            <div className="text-center space-y-4">
              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Solicite um novo link em &quot;Esqueci minha senha&quot; na tela de login.
              </p>
              <Button asChild className="w-full">
                <Link to="/">Ir para o login</Link>
              </Button>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-1 px-2 py-2 bg-muted/50 rounded-md">
                    <p className="text-xs font-medium mb-2">Requisitos da senha:</p>
                    <div className="space-y-1">
                      {[
                        { met: passwordRequirements.minLength, label: 'Mínimo 8 caracteres' },
                        { met: passwordRequirements.hasNumber, label: 'Pelo menos 1 número' },
                        { met: passwordRequirements.hasUppercase, label: 'Pelo menos 1 letra maiúscula' },
                        {
                          met: passwordRequirements.hasSpecialChar,
                          label: 'Pelo menos 1 caractere especial (!@#$%&*?=-_+)',
                        },
                      ].map(({ met, label }) => (
                        <div key={label} className="flex items-center gap-2 text-xs">
                          {met ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={met ? 'line-through text-muted-foreground' : ''}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
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

              <Button
                type="submit"
                className="w-full"
                disabled={
                  loading ||
                  !passwordRequirements.minLength ||
                  !passwordRequirements.hasNumber ||
                  !passwordRequirements.hasUppercase ||
                  !passwordRequirements.hasSpecialChar
                }
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
