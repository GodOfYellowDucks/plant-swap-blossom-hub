
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PlantGrid from '@/components/PlantGrid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Leaf, 
  MapPin, 
  Plus,
  Clock,
  CheckCheck,
  Settings,
  Repeat
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import ProfileEdit from '@/components/ProfileEdit';
import AddPlantForm from '@/components/AddPlantForm';
import PlantEditForm from '@/components/PlantEditForm';
import { supabase, ensureStorageBuckets } from '@/integrations/supabase/client';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [availablePlants, setAvailablePlants] = useState<any[]>([]);
  const [exchangedPlants, setExchangedPlants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [isEditingPlant, setIsEditingPlant] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [pendingExchanges, setPendingExchanges] = useState(0);
  
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Ensure storage buckets exist when component mounts
    ensureStorageBuckets();
    
    if (!user) {
      navigate('/login');
      return;
    }

    const loadUserData = async () => {
      setIsLoading(true);
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileError) throw profileError;
        
        const { data: userAvailablePlants, error: plantsError } = await supabase
          .from('plants')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'available');
        
        if (plantsError) throw plantsError;
        
        const { data: userExchangedPlants, error: exchangedError } = await supabase
          .from('plants')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'exchanged');
        
        if (exchangedError) throw exchangedError;
        
        const { data: sentPending, error: sentError } = await supabase
          .from('exchange_offers')
          .select('id')
          .eq('sender_id', user.id)
          .eq('status', 'pending');
          
        if (sentError) throw sentError;
        
        const { data: receivedPending, error: receivedError } = await supabase
          .from('exchange_offers')
          .select('id')
          .eq('receiver_id', user.id)
          .eq('status', 'pending');
          
        if (receivedError) throw receivedError;
        
        const { data: awaitingConfirmation, error: awaitingError } = await supabase
          .from('exchange_offers')
          .select('id')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq('status', 'awaiting_confirmation');
          
        if (awaitingError) throw awaitingError;
        
        const totalPendingExchanges = 
          (sentPending?.length || 0) + 
          (receivedPending?.length || 0) + 
          (awaitingConfirmation?.length || 0);
        
        setProfile(profileData);
        setAvailablePlants(userAvailablePlants || []);
        setExchangedPlants(userExchangedPlants || []);
        setPendingExchanges(totalPendingExchanges);
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: "Error",
          description: "Failed to load your profile data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user, navigate, isEditing, isAddingPlant, isEditingPlant]);

  const handleAddPlant = () => {
    setIsAddingPlant(true);
    setIsEditingPlant(false);
    setSelectedPlantId(null);
  };

  const handleEditPlant = (plantId: string) => {
    setSelectedPlantId(plantId);
    setIsEditingPlant(true);
    setIsAddingPlant(false);
    setIsEditing(false);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setIsAddingPlant(false);
    setIsEditingPlant(false);
  };

  const getUserInitials = () => {
    if (!user || !user.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex flex-col items-center">
            <Leaf className="h-12 w-12 text-plant-500 animate-leaf-sway" />
            <p className="mt-4 text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Function to handle PlantCard's edit button click (to be passed to PlantGrid)
  const onPlantCardAction = (action: string, plantId: string) => {
    if (action === 'edit') {
      handleEditPlant(plantId);
    }
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="md:col-span-1">
          {isEditing ? (
            <ProfileEdit onCancel={() => setIsEditing(false)} />
          ) : (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <img
                  src={profile?.avatar_url || '/placeholder.svg'}
                  alt={profile?.name || user?.email}
                  className="h-32 w-32 rounded-full object-cover mb-4 bg-plant-100"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <h1 className="text-xl font-bold">{profile?.name || user?.email?.split('@')[0] || 'Plant Lover'}</h1>
                <div className="flex items-center text-gray-600 text-sm mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{profile?.location || 'No location set'}</span>
                </div>
                <p className="mt-4 text-gray-700">{profile?.bio || 'Welcome to your profile! You can add your bio by editing your profile.'}</p>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs gap-1"
                    onClick={handleEditProfile}
                  >
                    <Settings className="h-3 w-3" /> 
                    Edit Profile
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs gap-1 relative"
                    onClick={() => navigate('/exchanges')}
                  >
                    <Repeat className="h-3 w-3" /> 
                    Exchanges
                    {pendingExchanges > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {pendingExchanges}
                      </span>
                    )}
                  </Button>
                </div>
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
          )}
        </div>

        <div className="md:col-span-3">
          {isAddingPlant ? (
            <AddPlantForm 
              onSaved={() => setIsAddingPlant(false)}
              onCancel={() => setIsAddingPlant(false)}
            />
          ) : isEditingPlant && selectedPlantId ? (
            <PlantEditForm 
              plantId={selectedPlantId}
              onSaved={() => {
                setIsEditingPlant(false);
                setSelectedPlantId(null);
              }}
              onCancel={() => {
                setIsEditingPlant(false);
                setSelectedPlantId(null);
              }}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Plants</h2>
                <Button onClick={handleAddPlant} size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> 
                  Add Plant
                </Button>
              </div>
              
              <Tabs defaultValue="available">
                <TabsList>
                  <TabsTrigger value="available" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Available
                  </TabsTrigger>
                  <TabsTrigger value="exchanged" className="gap-2">
                    <CheckCheck className="h-4 w-4" />
                    Exchanged
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="available" className="mt-4">
                  <PlantGrid
                    plants={availablePlants}
                    emptyMessage="You don't have any plants available for exchange yet. Add your first plant!"
                    showActions={true}
                    onAction={onPlantCardAction}
                  />
                </TabsContent>

                <TabsContent value="exchanged" className="mt-4">
                  <PlantGrid
                    plants={exchangedPlants}
                    emptyMessage="You haven't completed any exchanges yet."
                    showActions={true}
                    onAction={onPlantCardAction}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserProfilePage;
