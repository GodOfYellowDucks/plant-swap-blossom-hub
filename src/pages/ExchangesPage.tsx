
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  Leaf,
  ArrowLeft,
  Check,
  X,
  ArrowRight,
  CheckCheck,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ExchangesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [sentExchanges, setSentExchanges] = useState<any[]>([]);
  const [receivedExchanges, setReceivedExchanges] = useState<any[]>([]);
  const [userPlants, setUserPlants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlants, setSelectedPlants] = useState<string[]>([]);
  const [currentExchange, setCurrentExchange] = useState<any | null>(null);
  const [showSelectPlantsDialog, setShowSelectPlantsDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadExchanges();
  }, [user, navigate]);

  const loadExchanges = async () => {
    setIsLoading(true);
    try {
      // Load sent exchanges
      const { data: sent, error: sentError } = await supabase
        .from('exchange_offers')
        .select(`
          *,
          receiver_plant:plants!exchange_offers_receiver_plant_id_fkey(*),
          receiver:profiles!exchange_offers_receiver_id_fkey(*)
        `)
        .eq('sender_id', user!.id);

      if (sentError) throw sentError;

      // Load received exchanges
      const { data: received, error: receivedError } = await supabase
        .from('exchange_offers')
        .select(`
          *,
          sender_plant:plants!exchange_offers_sender_plant_id_fkey(*),
          sender:profiles!exchange_offers_sender_id_fkey(*),
          receiver_plant:plants!exchange_offers_receiver_plant_id_fkey(*)
        `)
        .eq('receiver_id', user!.id);

      if (receivedError) throw receivedError;

      // Load user's available plants for selection
      const { data: plants, error: plantsError } = await supabase
        .from('plants')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'available');

      if (plantsError) throw plantsError;

      // Process received data
      const processedSent = await Promise.all((sent || []).map(async (exchange) => {
        // For each sent exchange, get the receiver's plant
        if (!exchange.receiver_plant) {
          const { data: plant } = await supabase
            .from('plants')
            .select('*')
            .eq('id', exchange.receiver_plant_id)
            .single();
          exchange.receiver_plant = plant;
        }
        
        // Get receiver profile if missing
        if (!exchange.receiver) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', exchange.receiver_id)
            .single();
          exchange.receiver = profile;
        }

        return exchange;
      }));

      // Process received exchanges
      const processedReceived = await Promise.all((received || []).map(async (exchange) => {
        // For each received exchange, get the sender's profile if missing
        if (!exchange.sender) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', exchange.sender_id)
            .single();
          exchange.sender = profile;
        }

        // If selected_plants_ids is populated, fetch those plants
        if (exchange.selected_plants_ids && exchange.selected_plants_ids.length > 0) {
          const { data: selectedPlants } = await supabase
            .from('plants')
            .select('*')
            .in('id', exchange.selected_plants_ids);
          exchange.selected_plants = selectedPlants || [];
        } else {
          exchange.selected_plants = [];
        }

        return exchange;
      }));

      setSentExchanges(processedSent || []);
      setReceivedExchanges(processedReceived || []);
      setUserPlants(plants || []);
    } catch (error) {
      console.error('Error loading exchanges:', error);
      toast({
        title: "Error",
        description: "Failed to load exchanges. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlants = (exchangeId: string) => {
    const exchange = receivedExchanges.find(e => e.id === exchangeId);
    if (exchange) {
      setCurrentExchange(exchange);
      setSelectedPlants(exchange.selected_plants_ids || []);
      setShowSelectPlantsDialog(true);
    }
  };

  const handleConfirmExchange = (exchangeId: string) => {
    const exchange = [...sentExchanges, ...receivedExchanges].find(e => e.id === exchangeId);
    if (exchange) {
      setCurrentExchange(exchange);
      setShowConfirmDialog(true);
    }
  };

  const handlePlantSelection = (plantId: string) => {
    setSelectedPlants(prev => {
      if (prev.includes(plantId)) {
        return prev.filter(id => id !== plantId);
      } else {
        return [...prev, plantId];
      }
    });
  };

  const handleSubmitPlantSelection = async () => {
    if (!currentExchange) return;

    try {
      // Update the exchange with the selected plants
      const { error: updateError } = await supabase
        .from('exchange_offers')
        .update({
          selected_plants_ids: selectedPlants,
          status: 'awaiting_confirmation',
          sender_plant_id: selectedPlants.length > 0 ? selectedPlants[0] : null
        })
        .eq('id', currentExchange.id);

      if (updateError) throw updateError;

      // Create notification for the sender
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: currentExchange.sender_id,
          message: `Your exchange request has been accepted. Check your exchanges to confirm.`,
          related_exchange_id: currentExchange.id,
          read: false
        });

      if (notificationError) throw notificationError;

      toast({
        title: "Plants Selected",
        description: "You have successfully selected plants for the exchange.",
      });

      setShowSelectPlantsDialog(false);
      loadExchanges();
    } catch (error) {
      console.error('Error selecting plants:', error);
      toast({
        title: "Error",
        description: "Failed to select plants. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteExchange = async () => {
    if (!currentExchange) return;

    try {
      // Update the exchange status
      const { error: updateError } = await supabase
        .from('exchange_offers')
        .update({ status: 'completed' })
        .eq('id', currentExchange.id);

      if (updateError) throw updateError;

      // Update the status of the plants to 'exchanged'
      const plantsToUpdate = [currentExchange.receiver_plant_id];
      if (currentExchange.selected_plants_ids && currentExchange.selected_plants_ids.length > 0) {
        plantsToUpdate.push(...currentExchange.selected_plants_ids);
      }

      for (const plantId of plantsToUpdate) {
        const { error: plantError } = await supabase
          .from('plants')
          .update({ status: 'exchanged' })
          .eq('id', plantId);

        if (plantError) {
          console.error(`Error updating plant ${plantId}:`, plantError);
        }
      }

      // Create notifications for both users
      const { error: notificationError1 } = await supabase
        .from('notifications')
        .insert({
          user_id: currentExchange.sender_id,
          message: `The exchange has been completed successfully!`,
          related_exchange_id: currentExchange.id,
          read: false
        });

      if (notificationError1) throw notificationError1;

      const { error: notificationError2 } = await supabase
        .from('notifications')
        .insert({
          user_id: currentExchange.receiver_id,
          message: `The exchange has been completed successfully!`,
          related_exchange_id: currentExchange.id,
          read: false
        });

      if (notificationError2) throw notificationError2;

      toast({
        title: "Exchange Completed",
        description: "The exchange has been completed successfully!",
      });

      setShowConfirmDialog(false);
      loadExchanges();
    } catch (error) {
      console.error('Error completing exchange:', error);
      toast({
        title: "Error",
        description: "Failed to complete the exchange. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelExchange = async (exchangeId: string) => {
    try {
      const exchange = [...sentExchanges, ...receivedExchanges].find(e => e.id === exchangeId);
      if (!exchange) return;

      // Update the exchange status
      const { error: updateError } = await supabase
        .from('exchange_offers')
        .update({ status: 'cancelled' })
        .eq('id', exchangeId);

      if (updateError) throw updateError;

      // Create notification for the other user
      const otherUserId = user!.id === exchange.sender_id ? exchange.receiver_id : exchange.sender_id;
      
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: otherUserId,
          message: `An exchange request has been cancelled.`,
          related_exchange_id: exchangeId,
          read: false
        });

      if (notificationError) throw notificationError;

      toast({
        title: "Exchange Cancelled",
        description: "The exchange has been cancelled.",
      });

      loadExchanges();
    } catch (error) {
      console.error('Error cancelling exchange:', error);
      toast({
        title: "Error",
        description: "Failed to cancel the exchange. Please try again.",
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
            <p className="mt-4 text-gray-600">Loading exchanges...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="capitalize">Pending</Badge>;
      case 'awaiting_confirmation':
        return <Badge variant="warning" className="capitalize bg-amber-500">Awaiting Confirmation</Badge>;
      case 'completed':
        return <Badge variant="success" className="capitalize bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="capitalize">Cancelled</Badge>;
      default:
        return <Badge className="capitalize">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Plant Exchanges</h1>
          <p className="text-gray-600">Manage your plant exchange requests and offers</p>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Tabs defaultValue="received" className="space-y-6">
        <TabsList>
          <TabsTrigger value="received" className="relative">
            Received Requests
            {receivedExchanges.filter(e => e.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {receivedExchanges.filter(e => e.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="relative">
            Sent Requests
            {sentExchanges.filter(e => e.status === 'awaiting_confirmation').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {sentExchanges.filter(e => e.status === 'awaiting_confirmation').length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Received Exchanges */}
        <TabsContent value="received">
          {receivedExchanges.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Leaf className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  You don't have any received exchange requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {receivedExchanges.map((exchange) => (
                <Card key={exchange.id} className={exchange.status === 'cancelled' ? "opacity-75" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        Exchange Request from {exchange.sender?.name || exchange.sender?.username || 'User'}
                      </CardTitle>
                      {getStatusBadge(exchange.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">They Want:</p>
                        <div className="bg-gray-50 p-3 rounded-md flex items-center">
                          <img
                            src={exchange.receiver_plant?.image_url || '/placeholder.svg'}
                            alt={exchange.receiver_plant?.name}
                            className="w-16 h-16 rounded-md object-cover mr-3"
                            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                          />
                          <div>
                            <p className="font-medium">{exchange.receiver_plant?.name}</p>
                            <p className="text-xs text-gray-600">{exchange.receiver_plant?.species}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center items-center">
                        <ArrowRight className="h-6 w-6 text-gray-400" />
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Your Selection:</p>
                        {exchange.status === 'pending' ? (
                          <div className="bg-gray-100 p-3 rounded-md text-center">
                            <p className="text-sm text-gray-600">
                              No plants selected yet. Select which of your plants you want to offer in exchange.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {exchange.selected_plants && exchange.selected_plants.length > 0 ? (
                              exchange.selected_plants.map((plant: any) => (
                                <div key={plant.id} className="bg-gray-50 p-3 rounded-md flex items-center">
                                  <img
                                    src={plant.image_url || '/placeholder.svg'}
                                    alt={plant.name}
                                    className="w-16 h-16 rounded-md object-cover mr-3"
                                    onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                                  />
                                  <div>
                                    <p className="font-medium">{plant.name}</p>
                                    <p className="text-xs text-gray-600">{plant.species}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="bg-gray-100 p-3 rounded-md text-center">
                                <p className="text-sm text-gray-600">No plants selected</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {exchange.status === 'completed' && (
                      <div className="mt-4 p-3 bg-green-50 rounded-md text-center">
                        <p className="text-green-700 flex items-center justify-center">
                          <CheckCheck className="h-5 w-5 mr-2" />
                          This exchange has been completed successfully!
                        </p>
                      </div>
                    )}

                    {exchange.status === 'cancelled' && (
                      <div className="mt-4 p-3 bg-red-50 rounded-md text-center">
                        <p className="text-red-700 flex items-center justify-center">
                          <X className="h-5 w-5 mr-2" />
                          This exchange has been cancelled.
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-end space-x-2">
                    {exchange.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelExchange(exchange.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSelectPlants(exchange.id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Select Plants
                        </Button>
                      </>
                    )}

                    {exchange.status === 'awaiting_confirmation' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleConfirmExchange(exchange.id)}
                      >
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Complete Exchange
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sent Exchanges */}
        <TabsContent value="sent">
          {sentExchanges.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Leaf className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  You haven't sent any exchange requests yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sentExchanges.map((exchange) => (
                <Card key={exchange.id} className={exchange.status === 'cancelled' ? "opacity-75" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        Exchange Request to {exchange.receiver?.name || exchange.receiver?.username || 'User'}
                      </CardTitle>
                      {getStatusBadge(exchange.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">You Want:</p>
                        <div className="bg-gray-50 p-3 rounded-md flex items-center">
                          <img
                            src={exchange.receiver_plant?.image_url || '/placeholder.svg'}
                            alt={exchange.receiver_plant?.name}
                            className="w-16 h-16 rounded-md object-cover mr-3"
                            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                          />
                          <div>
                            <p className="font-medium">{exchange.receiver_plant?.name}</p>
                            <p className="text-xs text-gray-600">{exchange.receiver_plant?.species}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center items-center">
                        <ArrowRight className="h-6 w-6 text-gray-400" />
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Their Selection:</p>
                        {exchange.status === 'pending' ? (
                          <div className="bg-gray-100 p-3 rounded-md text-center">
                            <p className="text-sm text-gray-600">
                              <Clock className="h-4 w-4 inline mr-1" />
                              Waiting for them to select plants...
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {exchange.selected_plants_ids && exchange.selected_plants_ids.length > 0 ? (
                              // Fetch and display selected plants based on IDs
                              <div className="text-center py-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => navigate(`/plants/${exchange.selected_plants_ids[0]}`)}
                                >
                                  View Selected Plant
                                </Button>
                              </div>
                            ) : (
                              <div className="bg-gray-100 p-3 rounded-md text-center">
                                <p className="text-sm text-gray-600">No plants selected yet</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {exchange.status === 'completed' && (
                      <div className="mt-4 p-3 bg-green-50 rounded-md text-center">
                        <p className="text-green-700 flex items-center justify-center">
                          <CheckCheck className="h-5 w-5 mr-2" />
                          This exchange has been completed successfully!
                        </p>
                      </div>
                    )}

                    {exchange.status === 'cancelled' && (
                      <div className="mt-4 p-3 bg-red-50 rounded-md text-center">
                        <p className="text-red-700 flex items-center justify-center">
                          <X className="h-5 w-5 mr-2" />
                          This exchange has been cancelled.
                        </p>
                      </div>
                    )}

                    {exchange.status === 'awaiting_confirmation' && (
                      <div className="mt-4 p-3 bg-amber-50 rounded-md text-center">
                        <p className="text-amber-700 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          Your exchange offer has been accepted. Please confirm when you receive the plant.
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-end space-x-2">
                    {exchange.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelExchange(exchange.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Request
                      </Button>
                    )}

                    {exchange.status === 'awaiting_confirmation' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleConfirmExchange(exchange.id)}
                      >
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Complete Exchange
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog for selecting plants */}
      <Dialog open={showSelectPlantsDialog} onOpenChange={setShowSelectPlantsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Plants to Offer</DialogTitle>
            <DialogDescription>
              Choose which of your plants you would like to offer in exchange.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Your Available Plants</h3>
              <span className="text-sm text-gray-500">
                Selected: {selectedPlants.length}/{userPlants.length}
              </span>
            </div>
            
            {userPlants.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-600">You don't have any plants available for exchange.</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-3">
                {userPlants.map((plant) => (
                  <div key={plant.id} className="flex items-center space-x-3 p-2 border rounded-md hover:bg-gray-50">
                    <Checkbox
                      id={`plant-${plant.id}`}
                      checked={selectedPlants.includes(plant.id)}
                      onCheckedChange={() => handlePlantSelection(plant.id)}
                    />
                    <div className="flex flex-1 items-center space-x-3">
                      <img
                        src={plant.image_url || '/placeholder.svg'}
                        alt={plant.name}
                        className="h-12 w-12 rounded-md object-cover"
                        onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                      />
                      <Label
                        htmlFor={`plant-${plant.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{plant.name}</div>
                        <div className="text-xs text-gray-500">{plant.species}</div>
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSelectPlantsDialog(false)}>
              Cancel
            </Button>
            <Button 
              disabled={selectedPlants.length === 0 || userPlants.length === 0}
              onClick={handleSubmitPlantSelection}
            >
              Accept Exchange
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for confirming exchange completion */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Exchange</DialogTitle>
            <DialogDescription>
              Confirm that you have exchanged the plants and are satisfied with the transaction.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-2">
            <p className="text-sm">
              By confirming, you indicate that:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>You have received the plant(s) you requested</li>
              <li>You have delivered the plant(s) you offered</li>
              <li>You are satisfied with the exchange</li>
            </ul>
            <p className="text-sm font-medium mt-4">
              This action will mark the plants as "exchanged" and they will no longer be available for other exchanges.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteExchange}>
              Confirm Exchange Completion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ExchangesPage;
