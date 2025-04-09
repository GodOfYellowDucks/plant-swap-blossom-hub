
import React from 'react';
import { Plant } from '@/data/mockData';
import PlantCard from './PlantCard';

interface PlantGridProps {
  plants: Plant[];
  emptyMessage?: string;
}

const PlantGrid: React.FC<PlantGridProps> = ({ 
  plants, 
  emptyMessage = "No plants found matching your criteria." 
}) => {
  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-lg text-gray-600">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {plants.map((plant) => (
        <PlantCard key={plant.id} plant={plant} />
      ))}
    </div>
  );
};

export default PlantGrid;
