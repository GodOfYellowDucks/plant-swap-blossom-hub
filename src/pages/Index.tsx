
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import PlantGrid from '@/components/PlantGrid';
import FilterBar from '@/components/FilterBar';
import { getPlants, Plant } from '@/data/mockData';
import { Leaf } from 'lucide-react';

const Index = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [plantType, setPlantType] = useState('all');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load all available plants
    const loadPlants = () => {
      const allPlants = getPlants({ status: 'available' });
      setPlants(allPlants);
      setFilteredPlants(allPlants);
      setIsLoading(false);
    };

    loadPlants();
  }, []);

  useEffect(() => {
    // Apply filters
    const applyFilters = () => {
      let filtered = getPlants({
        status: 'available',
        type: plantType !== 'all' ? plantType : undefined,
        location: location || undefined,
        search: searchTerm || undefined
      });
      
      setFilteredPlants(filtered);
    };

    applyFilters();
  }, [searchTerm, plantType, location]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setPlantType('all');
    setLocation('');
  };

  return (
    <Layout>
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Find Your Perfect Plant Exchange
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Browse plants shared by our community and find your next green companion. 
          Offer one of your plants in exchange and grow your collection!
        </p>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        plantType={plantType}
        setPlantType={setPlantType}
        location={location}
        setLocation={setLocation}
        onReset={handleResetFilters}
      />

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center">
            <Leaf className="h-12 w-12 text-plant-500 animate-leaf-sway" />
            <p className="mt-4 text-gray-600">Loading plants...</p>
          </div>
        </div>
      ) : (
        <PlantGrid 
          plants={filteredPlants} 
          emptyMessage="No plants found matching your criteria. Try adjusting your filters."
        />
      )}
    </Layout>
  );
};

export default Index;
