
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
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Загрузка всех доступных растений из Supabase
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
        console.error('Ошибка загрузки растений:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить растения. Пожалуйста, попробуйте снова.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPlants();
  }, []);

  useEffect(() => {
    // Применение фильтров
    const applyFilters = () => {
      let result = [...plants];
      
      // Применение фильтра поиска
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        result = result.filter(
          plant => plant.name.toLowerCase().includes(searchLower) ||
                  plant.species.toLowerCase().includes(searchLower) ||
                  (plant.description && plant.description.toLowerCase().includes(searchLower))
        );
      }
      
      // Применение фильтра местоположения
      if (location) {
        result = result.filter(
          plant => plant.location && plant.location.toLowerCase().includes(location.toLowerCase())
        );
      }
      
      setFilteredPlants(result);
    };

    applyFilters();
  }, [searchTerm, location, plants]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setLocation('');
  };

  return (
    <Layout>
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Найдите идеальный обмен растениями
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Просматривайте растения, которыми делятся участники нашего сообщества, и найдите своего следующего зеленого компаньона. 
          Предложите одно из своих растений в обмен и пополните свою коллекцию!
        </p>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        location={location}
        setLocation={setLocation}
        onReset={handleResetFilters}
      />

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center">
            <Leaf className="h-12 w-12 text-plant-500 animate-leaf-sway" />
            <p className="mt-4 text-gray-600">Загрузка растений...</p>
          </div>
        </div>
      ) : (
        <PlantGrid 
          plants={filteredPlants} 
          emptyMessage="Не найдено растений, соответствующих вашим критериям. Попробуйте изменить фильтры."
        />
      )}
    </Layout>
  );
};

export default Index;
