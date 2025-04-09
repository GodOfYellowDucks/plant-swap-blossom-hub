
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface PlantCardProps {
  plant: any;
}

const PlantCard: React.FC<PlantCardProps> = ({ plant }) => {
  const { id, name, species, location, image_url, type, status } = plant;

  return (
    <Link to={`/plants/${id}`}>
      <Card className="overflow-hidden h-full plant-card-hover bg-white">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image_url} 
            alt={name} 
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          <div className="absolute top-2 right-2">
            <Badge className="capitalize bg-plant-100 text-plant-800 hover:bg-plant-200">
              {type || 'Plant'}
            </Badge>
          </div>
          {status !== 'available' && (
            <div className="absolute top-2 left-2">
              <Badge variant={status === 'exchanged' ? 'destructive' : 'secondary'} className="capitalize">
                {status}
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">{name}</h3>
          <p className="text-sm text-gray-500 mb-2">{species}</p>
        </CardContent>
        <CardFooter className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-600 flex items-center">
          <MapPin className="h-4 w-4 mr-1 text-plant-500" />
          {location || 'No location'}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default PlantCard;
