
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Leaf, Home } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-plant-50">
      <div className="text-center px-4">
        <div className="flex justify-center mb-6">
          <Leaf className="h-16 w-16 text-plant-500 animate-leaf-sway" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Oops! This page is not growing here.</p>
        <Button asChild size="lg" className="bg-plant-500 hover:bg-plant-600">
          <Link to="/" className="flex items-center">
            <Home className="mr-2 h-5 w-5" />
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
