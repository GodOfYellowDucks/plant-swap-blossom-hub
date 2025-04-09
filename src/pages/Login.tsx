
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Leaf, LogIn } from 'lucide-react';
import { users } from '@/data/mockData';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <Card className="bg-white shadow-sm">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Leaf className="h-12 w-12 text-plant-500" />
            </div>
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
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
                    Logging in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Log in
                  </span>
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center text-sm">
              <p className="text-gray-500">For demo purposes, you can use:</p>
              <div className="mt-2 grid gap-1">
                {users.map((user) => (
                  <div key={user.id} className="text-xs bg-gray-50 p-1 rounded">
                    Username: <span className="font-mono">{user.username}</span> | 
                    Password: <span className="font-mono">{user.password}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-gray-600 w-full">
              Don't have an account? <Link to="/register" className="text-plant-600 hover:text-plant-700 font-medium">Create one</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;
