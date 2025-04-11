
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface PlantCardProps {
  plant: any;
}

const PlantCard: React.FC<PlantCardProps> = ({ plant }) => {
  const { id, name, species, location, image_url, type, status } = plant;
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleExchangeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Если это собственное растение пользователя, переходим к обменам
    if (user && user.id === plant.user_id) {
      navigate('/exchanges');
    } else {
      // В противном случае переходим на страницу растения
      navigate(`/plants/${id}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="capitalize bg-plant-100 text-plant-800 hover:bg-plant-200">Доступно</Badge>;
      case 'exchanged':
        return <Badge variant="destructive" className="capitalize">Обменено</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="capitalize">Ожидает</Badge>;
      default:
        return <Badge className="capitalize">{status}</Badge>;
    }
  };

  return (
    <Link to={`/plants/${id}`} className="block h-full">
      <Card className="overflow-hidden h-full plant-card-hover bg-white relative">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image_url || '/placeholder.svg'} 
            alt={name} 
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          <div className="absolute top-2 right-2">
            <Badge className="capitalize bg-plant-100 text-plant-800 hover:bg-plant-200">
              {type || 'Растение'}
            </Badge>
          </div>
          {status !== 'available' && (
            <div className="absolute top-2 left-2">
              {getStatusBadge(status)}
            </div>
          )}
          
          {/* Показать кнопку обмена для собственных растений, которые участвуют в обмене */}
          {user && user.id === plant.user_id && status === 'pending' && (
            <div className="absolute bottom-2 right-2">
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-plant-500 hover:bg-plant-600 text-white p-1 h-8" 
                onClick={handleExchangeClick}
              >
                <Repeat className="h-4 w-4 mr-1" />
                Просмотр обмена
              </Button>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">{name}</h3>
          <p className="text-sm text-gray-500 mb-2">{species}</p>
        </CardContent>
        <CardFooter className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-600 flex items-center">
          <MapPin className="h-4 w-4 mr-1 text-plant-500" />
          {location || 'Нет местоположения'}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default PlantCard;
