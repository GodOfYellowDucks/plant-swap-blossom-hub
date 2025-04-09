
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Home, Leaf, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getUserNotifications } from '@/data/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get unread notifications count
  const unreadNotificationsCount = user
    ? getUserNotifications(user.id).filter(n => !n.read).length
    : 0;

  return (
    <div className="min-h-screen bg-plant-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-plant-500 animate-leaf-sway" />
            <span className="text-2xl font-bold text-plant-500">Blossom Hub</span>
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link 
              to="/" 
              className={`text-gray-600 hover:text-plant-500 transition-colors ${
                location.pathname === '/' ? 'font-medium text-plant-500' : ''
              }`}
            >
              <span className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                Home
              </span>
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className={`text-gray-600 hover:text-plant-500 transition-colors ${
                    location.pathname === '/profile' ? 'font-medium text-plant-500' : ''
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <UserIcon className="h-4 w-4" />
                    My Profile
                  </span>
                </Link>
                
                <Link 
                  to="/notifications" 
                  className="relative text-gray-600 hover:text-plant-500 transition-colors"
                >
                  <Bell className="h-6 w-6" />
                  {unreadNotificationsCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
                    >
                      {unreadNotificationsCount}
                    </Badge>
                  )}
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile/plants')}>
                      <Leaf className="mr-2 h-4 w-4" />
                      <span>My Plants</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={() => navigate('/login')} variant="default" className="bg-plant-500 hover:bg-plant-600">
                <LogIn className="mr-2 h-4 w-4" />
                Log in
              </Button>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="bg-white py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Blossom Hub. All rights reserved.</p>
            <p className="mt-1">Connect with plant enthusiasts and grow your collection!</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
