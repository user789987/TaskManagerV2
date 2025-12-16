import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, CheckCircle, Users } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = authSchema.extend({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['manager', 'user']),
});

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user' as 'manager' | 'user',
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-soft text-primary">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = authSchema.safeParse(loginData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setFormLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setFormLoading(false);
    
    if (error) {
      setErrors({ form: error.message });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = signupSchema.safeParse(signupData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setFormLoading(true);
    const { error } = await signUp(signupData.email, signupData.password, signupData.fullName, signupData.role);
    setFormLoading(false);
    
    if (error) {
      if (error.message.includes('already registered')) {
        setErrors({ email: 'This email is already registered. Please log in instead.' });
      } else {
        setErrors({ form: error.message });
      }
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <header className="container py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">T</span>
          </div>
          <h1 className="font-display text-xl font-bold">TaskFlow</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </header>

      <main className="flex-1 container flex items-center justify-center py-12">
        <div className="w-full max-w-[450px] animate-slide-up">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-display text-2xl">Welcome to TaskFlow</CardTitle>
              <CardDescription>
                Collaborative task management for teams
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-2">
              <Tabs value={tab} onValueChange={v => { setTab(v as any); setErrors({}); }}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    {errors.form && (
                      <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        {errors.form}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginData.email}
                        onChange={e => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={e => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        className={errors.password ? 'border-destructive' : ''}
                      />
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>
                    
                    <Button type="submit" className="w-full" size="lg" disabled={formLoading}>
                      {formLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    {errors.form && (
                      <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        {errors.form}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        placeholder="John Doe"
                        value={signupData.fullName}
                        onChange={e => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                        className={errors.fullName ? 'border-destructive' : ''}
                      />
                      {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupData.email}
                        onChange={e => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={e => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                        className={errors.password ? 'border-destructive' : ''}
                      />
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Role</Label>
                      <RadioGroup
                        value={signupData.role}
                        onValueChange={value => setSignupData(prev => ({ ...prev, role: value as any }))}
                        className="grid grid-cols-2 gap-4"
                      >
                        <Label
                          htmlFor="role-user"
                          className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                        >
                          <RadioGroupItem value="user" id="role-user" className="sr-only" />
                          <CheckCircle className="mb-2 h-6 w-6" />
                          <span className="font-medium">User</span>
                          <span className="text-xs text-muted-foreground text-center">View & update tasks</span>
                        </Label>
                        <Label
                          htmlFor="role-manager"
                          className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                        >
                          <RadioGroupItem value="manager" id="role-manager" className="sr-only" />
                          <Users className="mb-2 h-6 w-6" />
                          <span className="font-medium">Manager</span>
                          <span className="text-xs text-muted-foreground text-center">Create & assign tasks</span>
                        </Label>
                      </RadioGroup>
                    </div>
                    
                    <Button type="submit" className="w-full" size="lg" disabled={formLoading}>
                      {formLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
