
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, getCurrentUser, setCurrentUser, User } from '../data/mockData';
import { useToast } from '../hooks/use-toast';

type AuthContextType = {
  user: Omit<User, 'password'> | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkLoggedIn = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setCurrentUser(parsedUser);
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkLoggedIn();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const authenticatedUser = loginUser(username, password);
      
      if (authenticatedUser) {
        setUser(authenticatedUser);
        setCurrentUser(authenticatedUser);
        localStorage.setItem('user', JSON.stringify(authenticatedUser));
        toast({
          title: "Login successful",
          description: `Welcome back, ${authenticatedUser.name}!`,
        });
        return true;
      } else {
        toast({
          title: "Login failed",
          description: "Invalid username or password.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentUser(null);
    localStorage.removeItem('user');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
