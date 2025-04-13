
import React from 'react';
import PlantCard from './PlantCard';
import { Leaf } from 'lucide-react';

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
  }>;
  emptyMessage?: string;
  showActions?: boolean;
  onAction?: (action: string, plantId: string) => void;
}

const PlantGrid = ({ 
  plants, 
  emptyMessage = "No plants found.", 
  showActions = false,
  onAction 
}: PlantGridProps) => {
  if (!plants || plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Leaf className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500">{emptyMessage}</p>
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
