
import React from 'react';
import { Search, Filter, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  plantType: string;
  setPlantType: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  plantType,
  setPlantType,
  location,
  setLocation,
  onReset,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="mb-1 block">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="search"
              type="text"
              placeholder="Search by name, species or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="w-full md:w-48">
          <Label htmlFor="plant-type" className="mb-1 block">Plant Type</Label>
          <Select value={plantType} onValueChange={setPlantType}>
            <SelectTrigger id="plant-type" className="w-full">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="cactus">Cacti</SelectItem>
              <SelectItem value="flower">Flowers</SelectItem>
              <SelectItem value="tree">Trees</SelectItem>
              <SelectItem value="herb">Herbs</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-48">
          <Label htmlFor="location" className="mb-1 block">Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="location"
              type="text"
              placeholder="Enter a location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-end">
          <Button variant="outline" onClick={onReset} className="w-full md:w-auto">
            <Filter className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
