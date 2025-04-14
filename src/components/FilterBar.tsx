
import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  location: string;
  setLocation: (location: string) => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  location,
  setLocation,
  onReset
}) => {
  return (
    <div className="mb-8 bg-white p-4 rounded-lg shadow-sm border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Поиск растений..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Местоположение"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1"
          />
          {(searchTerm || location) && (
            <Button variant="outline" onClick={onReset} className="whitespace-nowrap">
              Сбросить фильтры
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
