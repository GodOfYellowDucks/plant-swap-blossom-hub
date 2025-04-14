
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Leaf, LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Перенаправление на главную, если пользователь уже авторизован
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Если пользователь авторизован, не показываем содержимое страницы
  if (user) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <Card className="bg-white shadow-sm">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Leaf className="h-12 w-12 text-plant-500" />
            </div>
            <CardTitle className="text-2xl text-center">Войти в аккаунт</CardTitle>
            <CardDescription className="text-center">
              Войдите, чтобы получить доступ к вашему профилю и растениям
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Электронная почта</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Введите вашу электронную почту"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите ваш пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-plant-500 hover:bg-plant-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Вход...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Войти
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-gray-600 w-full">
              Нет аккаунта? <Link to="/register" className="text-plant-600 hover:text-plant-700 font-medium">Зарегистрироваться</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;
