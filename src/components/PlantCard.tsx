
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PlantCardProps {
  plant: {
    id: string;
    name: string;
    species: string;
    subspecies?: string;
    location?: string;
    image_url?: string;
    status?: string;
    user_id: string;
  };
  showActions?: boolean;
  onAction?: (action: string, plantId: string) => void;
}

const PlantCard = ({ plant, showActions = false, onAction }: PlantCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwnPlant = user && user.id === plant.user_id;

  const handleCardClick = () => {
    navigate(`/plants/${plant.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAction) {
      onAction('edit', plant.id);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Доступно';
      case 'pending':
        return 'В ожидании';
      case 'exchanged':
        return 'Обменено';
      case 'cancelled':
        return 'Отменено';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Card 
      className="group overflow-hidden transition-all hover:shadow-md cursor-pointer relative"
      onClick={handleCardClick}
    >
      <div className="aspect-square w-full overflow-hidden bg-gray-100">
        {plant.image_url ? (
          <img
            src={plant.image_url}
            alt={plant.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
            <span className="text-xs">Нет изображения</span>
          </div>
        )}
      </div>
      
      {plant.status && plant.status !== 'available' && (
        <div className="absolute top-2 right-2">
          <Badge variant={plant.status === 'exchanged' ? 'success' : (plant.status === 'cancelled' ? 'destructive' : 'default')}>
            {getStatusText(plant.status)}
          </Badge>
        </div>
      )}

      {showActions && isOwnPlant && (
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-2 left-2 h-8 w-8 p-0 opacity-80 hover:opacity-100"
          onClick={handleEditClick}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
      
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-semibold line-clamp-1">{plant.name}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-3 pt-0 text-xs text-gray-500">
        <p className="italic line-clamp-1">
          {plant.species}
          {plant.subspecies && <span> ({plant.subspecies})</span>}
        </p>
        
        {plant.location && (
          <div className="mt-1 flex items-center">
            <MapPin className="mr-1 h-3 w-3" />
            <span className="line-clamp-1">{plant.location}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlantCard;
