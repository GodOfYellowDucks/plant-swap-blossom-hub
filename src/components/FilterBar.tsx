
import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  plantType: string;
  setPlantType: (type: string) => void;
  location: string;
  setLocation: (location: string) => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  plantType,
  setPlantType,
  location,
  setLocation,
  onReset
}) => {
  return (
    <div className="mb-8 bg-white p-4 rounded-lg shadow-sm border">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <Select value={plantType} onValueChange={setPlantType}>
          <SelectTrigger>
            <SelectValue placeholder="Тип растения" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            <SelectItem value="indoor">Комнатные</SelectItem>
            <SelectItem value="outdoor">Уличные</SelectItem>
            <SelectItem value="succulent">Суккуленты</SelectItem>
            <SelectItem value="herb">Травы</SelectItem>
            <SelectItem value="vegetable">Овощи</SelectItem>
            <SelectItem value="fruit">Фрукты</SelectItem>
            <SelectItem value="cactus">Кактусы</SelectItem>
            <SelectItem value="flower">Цветы</SelectItem>
            <SelectItem value="tree">Деревья</SelectItem>
            <SelectItem value="shrub">Кустарники</SelectItem>
            <SelectItem value="vine">Лианы</SelectItem>
            <SelectItem value="aquatic">Водные</SelectItem>
            <SelectItem value="other">Другое</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Местоположение"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1"
          />
          {(searchTerm || plantType !== 'all' || location) && (
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
