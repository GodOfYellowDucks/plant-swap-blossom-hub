
import React from 'react';
import PlantCard from './PlantCard';
import { Frown } from 'lucide-react';

interface Plant {
  id: string;
  name: string;
  species: string;
  image_url?: string;
  location?: string;
  [key: string]: any;
}

interface PlantGridProps {
  plants: Plant[];
  emptyMessage?: string;
}

const PlantGrid: React.FC<PlantGridProps> = ({ 
  plants, 
  emptyMessage = "Растения не найдены." 
}) => {
  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20">
        <Frown className="w-12 h-12 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {plants.map(plant => (
        <PlantCard key={plant.id} plant={plant} />
      ))}
    </div>
  );
};

export default PlantGrid;
