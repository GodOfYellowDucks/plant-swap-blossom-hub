
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";

// Страницы
import Index from "./pages/Index";
import PlantDetail from "./pages/PlantDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserProfile from "./pages/UserProfile";
import UserProfilePage from "./pages/UserProfilePage";
import ExchangesPage from "./pages/ExchangesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Защищенный маршрут для неаутентифицированных пользователей
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  // Показываем пустое содержимое во время загрузки
  if (isLoading) return null;
  
  // Если пользователь авторизован, перенаправляем на главную
  if (user) return <Navigate to="/" replace />;
  
  // Иначе показываем страницу
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/plants/:id" element={<PlantDetail />} />
        <Route path="/profile/:id" element={<UserProfile />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/exchanges" element={<ExchangesPage />} />
        {/* ДОБАВЛЯЙТЕ ВСЕ ПОЛЬЗОВАТЕЛЬСКИЕ МАРШРУТЫ ВЫШЕ МАРШРУТА-ПЕРЕХВАТЧИКА "*" */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
