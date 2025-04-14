
import React from 'react';
import PlantCard from './PlantCard';
import { Leaf, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PlantGridProps {
  plants: Array<{
    id: string;
    name: string;
    species: string;
    subspecies?: string;
    location?: string;
    image_url?: string;
    status?: string;
    user_id: string;
    plant_type?: string;
  }>;
  emptyMessage?: string;
  showActions?: boolean;
  onAction?: (action: string, plantId: string) => void;
  // Пропсы для выбора растений
  selectable?: boolean;
  selectedPlantIds?: string[];
  onPlantSelect?: (plantId: string, selected: boolean) => void;
}

const PlantGrid = ({ 
  plants, 
  emptyMessage = "Растения не найдены.", 
  showActions = false,
  onAction,
  selectable = false,
  selectedPlantIds = [],
  onPlantSelect
}: PlantGridProps) => {
  if (!plants || plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Leaf className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  if (selectable) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {plants.map((plant) => {
          const isSelected = selectedPlantIds.includes(plant.id);
          
          return (
            <Card 
              key={plant.id}
              className={`relative cursor-pointer transition-all ${isSelected ? 'ring-2 ring-green-500 border-green-500' : 'hover:shadow-md'}`}
              onClick={() => onPlantSelect && onPlantSelect(plant.id, !isSelected)}
            >
              <div className="aspect-square w-full overflow-hidden bg-gray-100 relative">
                {plant.image_url ? (
                  <img
                    src={plant.image_url}
                    alt={plant.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                    <span className="text-xs">Нет изображения</span>
                  </div>
                )}
                
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
              
              <CardContent className="p-3">
                <h3 className="font-medium text-sm line-clamp-1">{plant.name}</h3>
                <p className="text-xs text-gray-500 italic line-clamp-1">
                  {plant.species}
                  {plant.subspecies && <span> ({plant.subspecies})</span>}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {plants.map((plant) => (
        <PlantCard 
          key={plant.id} 
          plant={plant} 
          showActions={showActions}
          onAction={onAction}
        />
      ))}
    </div>
  );
};

export default PlantGrid;
