import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, User, Chrome, Eye, EyeOff, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AnimatedBackground from '@/components/AnimatedBackground';
import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[0-9]/, 'A senha deve conter pelo menos 1 número')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos 1 letra maiúscula')
  .regex(/[!@#$%&*?=\-_+]/, 'A senha deve conter pelo menos 1 caractere especial (!@#$%&*?=-_+)');

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasNumber: false,
    hasUppercase: false,
    hasSpecialChar: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se usuário já está logado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  // Validar requisitos de senha em tempo real
  useEffect(() => {
    if (password) {
      setPasswordRequirements({
        minLength: password.length >= 8,
        hasNumber: /[0-9]/.test(password),
        hasUppercase: /[A-Z]/.test(password),
        hasSpecialChar: /[!@#$%&*?=\-_+]/.test(password)
      });
    } else {
      setPasswordRequirements({
        minLength: false,
        hasNumber: false,
        hasUppercase: false,
        hasSpecialChar: false
      });
    }
  }, [password]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Validar senha antes de criar conta
        try {
          passwordSchema.parse(password);
        } catch (error: any) {
          if (error instanceof z.ZodError) {
            toast.error(error.errors[0].message);
            setLoading(false);
            return;
          }
        }
        // Sempre usar GitHub Pages para email confirmation URL
        const emailRedirectUrl = 'https://orodrigobraz.github.io/viaje.ro/';
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: emailRedirectUrl,
            data: {
              name: displayName
            }
          }
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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email ou senha incorretos');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Login realizado com sucesso!');
          navigate('/');
        }
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      // Sempre usar GitHub Pages para email confirmation URL
      const redirectUrl = 'https://orodrigobraz.github.io/viaje.ro/';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      
      if (error) {
        toast.error('Erro ao conectar com Google: ' + error.message);
      }
    } catch (error) {
      toast.error('Erro ao conectar com Google');
    }
  };


  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AnimatedBackground />
      <Card className="w-full max-w-md relative z-10 bg-background/95 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isSignUp ? 'Criar Conta' : 'Entrar'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp 
              ? 'Crie sua conta para salvar suas cidades visitadas'
              : 'Entre com sua conta para acessar suas cidades'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Social Login Buttons */}
          {/* <div className="space-y-2">
            <Button 
              onClick={handleGoogleAuth}
              variant="outline" 
              className="w-full"
              type="button"
            >
              <Chrome className="mr-2 h-4 w-4" />
              Continuar com Google
            </Button>
          </div> */}

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

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
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
                    required={isSignUp}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {isSignUp && password && (
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
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <Button
              type="button"
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm"
            >
              {isSignUp 
                ? 'Já tem uma conta? Faça login'
                : 'Não tem uma conta? Cadastre-se'
              }
            </Button>
            
            <div className="text-xs text-muted-foreground">
              <Link to="/" className="hover:underline">
                Voltar ao início
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;