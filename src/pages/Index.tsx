
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import PlantGrid from '@/components/PlantGrid';
import FilterBar from '@/components/FilterBar';
import { Leaf } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [plants, setPlants] = useState<any[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [plantType, setPlantType] = useState('all');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load all available plants from Supabase
    const loadPlants = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('plants')
          .select('*')
          .eq('status', 'available');
        
        if (error) throw error;
        
        setPlants(data || []);
        setFilteredPlants(data || []);
      } catch (error) {
        console.error('Error loading plants:', error);
        toast({
          title: "Error",
          description: "Failed to load plants. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPlants();
  }, []);

  useEffect(() => {
    // Apply filters
    const applyFilters = () => {
      let result = [...plants];
      
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        result = result.filter(
          plant => plant.name.toLowerCase().includes(searchLower) ||
                  plant.species.toLowerCase().includes(searchLower) ||
                  (plant.description && plant.description.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply plant type filter
      if (plantType !== 'all') {
        result = result.filter(plant => plant.type === plantType);
      }
      
      // Apply location filter
      if (location) {
        result = result.filter(
          plant => plant.location && plant.location.toLowerCase().includes(location.toLowerCase())
        );
      }
      
      setFilteredPlants(result);
    };

    applyFilters();
  }, [searchTerm, plantType, location, plants]);

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
