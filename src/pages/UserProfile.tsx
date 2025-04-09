
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PlantGrid from '@/components/PlantGrid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Leaf, 
  MapPin, 
  ArrowLeft, 
  Clock,
  CheckCheck
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any | null>(null);
  const [availablePlants, setAvailablePlants] = useState<any[]>([]);
  const [exchangedPlants, setExchangedPlants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadUserAndPlants = async () => {
      setIsLoading(true);
      
      // If on own profile page, redirect to the /profile route
      if (currentUser && currentUser.id === id) {
        navigate('/profile');
        return;
      }
      
      try {
        // Load user profile
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        
        if (userError) throw userError;
        setUser(userData);
        
        // Load user's available plants
        const { data: userAvailablePlants, error: availablePlantsError } = await supabase
          .from('plants')
          .select('*')
          .eq('user_id', id)
          .eq('status', 'available');
        
        if (availablePlantsError) throw availablePlantsError;
        setAvailablePlants(userAvailablePlants || []);
        
        // Load user's exchanged plants
        const { data: userExchangedPlants, error: exchangedPlantsError } = await supabase
          .from('plants')
          .select('*')
          .eq('user_id', id)
          .eq('status', 'exchanged');
        
        if (exchangedPlantsError) throw exchangedPlantsError;
        setExchangedPlants(userExchangedPlants || []);
      } catch (error) {
        console.error('Error loading user profile:', error);
        toast({
          title: "Error",
          description: "Failed to load user profile. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserAndPlants();
  }, [id, currentUser, navigate, toast]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex flex-col items-center">
            <Leaf className="h-12 w-12 text-plant-500 animate-leaf-sway" />
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900">User Not Found</h1>
          <p className="mt-2 text-gray-600">This user profile doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* User Info */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <img
                src={user.avatar_url}
                alt={user.name || user.username || 'User'}
                className="h-32 w-32 rounded-full object-cover mb-4"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <h1 className="text-xl font-bold">{user.name || user.username || 'User'}</h1>
              <div className="flex items-center text-gray-600 text-sm mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{user.location || 'No location set'}</span>
              </div>
              <p className="mt-4 text-gray-700">{user.bio || 'This user has not added a bio yet.'}</p>
            </div>
            
            <Separator className="my-6" />
            
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-plant-50 p-3 rounded-lg">
                <div className="text-xl font-semibold text-plant-600">{availablePlants.length}</div>
                <div className="text-xs text-gray-600">Available Plants</div>
              </div>
              <div className="bg-plant-50 p-3 rounded-lg">
                <div className="text-xl font-semibold text-plant-600">{exchangedPlants.length}</div>
                <div className="text-xs text-gray-600">Exchanges</div>
              </div>
            </div>
          </div>
        </div>

        {/* Plants */}
        <div className="md:col-span-3">
          <Tabs defaultValue="available" className="space-y-6">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="available" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Available Plants
                </TabsTrigger>
                <TabsTrigger value="exchanged" className="gap-2">
                  <CheckCheck className="h-4 w-4" />
                  Exchanged Plants
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="available" className="space-y-6">
              <PlantGrid
                plants={availablePlants}
                emptyMessage="This user doesn't have any plants available for exchange at the moment."
              />
            </TabsContent>

            <TabsContent value="exchanged" className="space-y-6">
              <PlantGrid
                plants={exchangedPlants}
                emptyMessage="This user hasn't completed any exchanges yet."
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
