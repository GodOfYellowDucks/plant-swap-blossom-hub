
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Leaf, 
  MapPin, 
  User as UserIcon, 
  Calendar, 
  Tag, 
  ArrowLeft, 
  ShoppingCart,
  Info,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const PlantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [plant, setPlant] = useState<any | null>(null);
  const [owner, setOwner] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlants, setUserPlants] = useState<any[]>([]);
  const [selectedPlants, setSelectedPlants] = useState<string[]>([]);
  const [existingExchange, setExistingExchange] = useState<any | null>(null);
  const [showExchangeDialog, setShowExchangeDialog] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadPlantAndOwner = async () => {
      setIsLoading(true);
      try {
        // Fetch plant data
        const { data: plantData, error: plantError } = await supabase
          .from('plants')
          .select('*')
          .eq('id', id)
          .single();
        
        if (plantError) throw plantError;
        if (!plantData) {
          setIsLoading(false);
          return;
        }
        
        setPlant(plantData);
        
        // Fetch owner profile
        const { data: ownerData, error: ownerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', plantData.user_id)
          .single();
        
        if (ownerError) throw ownerError;
        setOwner(ownerData);
        
        // Load user's available plants if logged in
        if (user) {
          const { data: myPlants, error: myPlantsError } = await supabase
            .from('plants')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'available');
          
          if (myPlantsError) throw myPlantsError;
          setUserPlants(myPlants || []);
          
          // Check if there's an existing exchange for this plant
          const { data: exchanges, error: exchangesError } = await supabase
            .from('exchange_offers')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${plantData.user_id},receiver_plant_id.eq.${id}),and(receiver_id.eq.${user.id},sender_id.eq.${plantData.user_id},sender_plant_id.eq.${id})`)
            .maybeSingle();
          
          if (exchangesError) throw exchangesError;
          
          if (exchanges) {
            setExistingExchange(exchanges);
          }
        }
      } catch (error) {
        console.error('Error loading plant details:', error);
        toast({
          title: "Error",
          description: "Failed to load plant details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPlantAndOwner();
  }, [id, user, navigate, toast]);

  const handlePlantSelection = (plantId: string) => {
    setSelectedPlants(prev => {
      if (prev.includes(plantId)) {
        return prev.filter(id => id !== plantId);
      } else {
        return [...prev, plantId];
      }
    });
  };

  const handleExchangeRequest = async () => {
    if (!user || !plant || !owner) {
      toast({
        title: "Error",
        description: "You must be logged in to request an exchange.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlants.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one plant to offer.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create exchange offer
      const { data: exchange, error: exchangeError } = await supabase
        .from('exchange_offers')
        .insert({
          sender_id: user.id,
          receiver_id: plant.user_id,
          sender_plant_id: selectedPlants[0], // For now, just use the first selected plant
          receiver_plant_id: plant.id,
          status: 'pending'
        })
        .select()
        .single();
      
      if (exchangeError) throw exchangeError;
      
      // Create notification for plant owner
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: plant.user_id,
          message: `${user.email} wants to exchange their plant for your ${plant.name}.`,
          related_exchange_id: exchange.id,
          read: false
        });
      
      if (notificationError) throw notificationError;

      toast({
        title: "Exchange Requested",
        description: "Your exchange request has been sent.",
      });
      
      setShowExchangeDialog(false);
      
      // Reload to update state
      navigate(0);
    } catch (error: any) {
      console.error('Failed to create exchange:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to request exchange. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex flex-col items-center">
            <Leaf className="h-12 w-12 text-plant-500 animate-leaf-sway" />
            <p className="mt-4 text-gray-600">Loading plant details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!plant || !owner) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900">Plant Not Found</h1>
          <p className="mt-2 text-gray-600">The plant you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </div>
      </Layout>
    );
  }

  const isOwner = user && user.id === plant.user_id;
  const canExchange = user && !isOwner && plant.status === 'available';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Plant Image */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            <img
              src={plant.image_url}
              alt={plant.name}
              className="w-full h-auto object-cover aspect-square"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </div>
        </div>

        {/* Plant Details */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{plant.name}</h1>
                <div className="flex items-center text-gray-600 mt-1">
                  <Tag className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {plant.species}
                    {plant.subspecies && ` (${plant.subspecies})`}
                  </span>
                </div>
              </div>
              <Badge 
                variant={plant.status === 'available' ? 'default' : plant.status === 'pending' ? 'secondary' : 'destructive'} 
                className="capitalize"
              >
                {plant.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-plant-500" />
                <span>{plant.location || 'No location'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-plant-500" />
                <span>Listed on {formatDate(plant.created_at)}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <UserIcon className="h-4 w-4 mr-2 text-plant-500" />
                <span>Owned by {owner.name || owner.username || 'User'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Leaf className="h-4 w-4 mr-2 text-plant-500" />
                <span className="capitalize">{plant.type || 'Plant'}</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{plant.description || 'No description provided.'}</p>
            </div>

            {/* Exchange Status */}
            {existingExchange && (
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {existingExchange.status === 'pending' ? (
                    <span>You already have a pending exchange request for this plant.</span>
                  ) : existingExchange.status === 'accepted' ? (
                    <span>This exchange has been accepted and is waiting for completion.</span>
                  ) : (
                    <span>This exchange has been {existingExchange.status}.</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {isOwner ? (
                <>
                  <Button onClick={() => navigate(`/profile`)} variant="outline">
                    Edit Plant
                  </Button>
                </>
              ) : canExchange ? (
                <>
                  {!existingExchange && (
                    <Dialog open={showExchangeDialog} onOpenChange={setShowExchangeDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-plant-500 hover:bg-plant-600">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Offer Exchange
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Offer an Exchange</DialogTitle>
                          <DialogDescription>
                            Select one or more of your plants to offer in exchange for {plant.name}.
                          </DialogDescription>
                        </DialogHeader>
                        
                        {userPlants.length === 0 ? (
                          <div className="py-6 text-center">
                            <p className="text-gray-600 mb-4">You don't have any plants available for exchange.</p>
                            <Button onClick={() => navigate('/profile')} variant="outline">
                              Add a Plant First
                            </Button>
                          </div>
                        ) : (
                          <div className="grid gap-4 py-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">Your Plants</h3>
                              <span className="text-sm text-gray-500">
                                Selected: {selectedPlants.length}/{userPlants.length}
                              </span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                              {userPlants.map((p) => (
                                <div key={p.id} className="flex items-center space-x-3 mb-4">
                                  <Checkbox
                                    id={`plant-${p.id}`}
                                    checked={selectedPlants.includes(p.id)}
                                    onCheckedChange={() => handlePlantSelection(p.id)}
                                  />
                                  <div className="flex flex-1 items-center space-x-3">
                                    <img
                                      src={p.image_url}
                                      alt={p.name}
                                      className="h-12 w-12 rounded-md object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = '/placeholder.svg';
                                      }}
                                    />
                                    <Label
                                      htmlFor={`plant-${p.id}`}
                                      className="flex-1 cursor-pointer"
                                    >
                                      <div className="font-medium">{p.name}</div>
                                      <div className="text-xs text-gray-500">{p.species}</div>
                                    </Label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <DialogFooter>
                          <Button
                            disabled={selectedPlants.length === 0 || userPlants.length === 0}
                            onClick={handleExchangeRequest}
                            className="bg-plant-500 hover:bg-plant-600"
                          >
                            Send Exchange Offer
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {existingExchange && existingExchange.status === 'pending' && (
                    <Button variant="outline" disabled>
                      <Clock className="mr-2 h-4 w-4" />
                      Exchange Pending
                    </Button>
                  )}
                  
                  {existingExchange && existingExchange.status === 'accepted' && (
                    <Button variant="default" onClick={() => navigate('/profile')}>
                      View Exchange
                    </Button>
                  )}
                </>
              ) : !user ? (
                <Button onClick={() => navigate('/login')} variant="outline">
                  Log in to Offer Exchange
                </Button>
              ) : (
                <Button disabled variant="outline">
                  {plant.status === 'exchanged' ? 'Already Exchanged' : 'Not Available'}
                </Button>
              )}
              
              <Button variant="ghost" onClick={() => navigate(`/profile/${plant.user_id}`)}>
                View Owner Profile
              </Button>
            </div>
          </div>
          
          {/* Owner Preview */}
          <div className="bg-white rounded-lg p-6 shadow-sm mt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-4">
                <img
                  src={owner.avatar_url}
                  alt={owner.name || 'User'}
                  className="h-16 w-16 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{owner.name || owner.username || 'User'}</h2>
                <p className="text-gray-600 text-sm">{owner.location || 'No location'}</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-plant-600 hover:text-plant-700"
                  onClick={() => navigate(`/profile/${owner.id}`)}
                >
                  View Profile
                </Button>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <p className="text-gray-700 text-sm line-clamp-3">
              {owner.bio || 'This user has not added a bio yet.'}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PlantDetail;
