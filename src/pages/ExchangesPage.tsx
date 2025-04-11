import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Exchange, ExchangeStatus, Plant, Profile } from '@/types/exchange';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="capitalize">Pending</Badge>;
    case 'awaiting_confirmation':
      return <Badge variant="outline" className="capitalize bg-amber-500 text-white">Awaiting Confirmation</Badge>;
    case 'completed':
      return <Badge variant="outline" className="capitalize bg-green-500 text-white">Completed</Badge>;
    case 'cancelled':
      return <Badge variant="destructive" className="capitalize">Cancelled</Badge>;
    default:
      return <Badge className="capitalize">{status}</Badge>;
  }
};

const ExchangesPage = () => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [statusFilter, setStatusFilter] = useState<ExchangeStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchExchanges = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!user) {
          console.error("User not logged in.");
          setError("Please log in to view your exchanges");
          setIsLoading(false);
          return;
        }

        console.log("Fetching exchanges for user:", user.id);

        const { data: exchangeData, error: exchangeError } = await supabase
          .from('exchange_offers')
          .select(`
            id, 
            sender_id, 
            receiver_id, 
            status, 
            created_at, 
            selected_plants_ids,
            sender_plant_id, 
            receiver_plant_id
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (exchangeError) {
          console.error("Error fetching exchanges:", exchangeError);
          setError("Failed to load exchanges. Please try again.");
          setIsLoading(false);
          return;
        }

        if (!exchangeData || exchangeData.length === 0) {
          console.log("No exchanges found");
          setExchanges([]);
          setIsLoading(false);
          return;
        }

        console.log("Raw exchange data:", exchangeData);
        
        const completeExchanges: Exchange[] = [];
        
        for (const exchange of exchangeData) {
          let status: ExchangeStatus = 'pending';
          if (exchange.status === 'pending' || 
              exchange.status === 'awaiting_confirmation' || 
              exchange.status === 'completed' || 
              exchange.status === 'cancelled') {
            status = exchange.status as ExchangeStatus;
          }
          
          const { data: senderPlantData, error: senderPlantError } = await supabase
            .from('plants')
            .select('*')
            .eq('id', exchange.sender_plant_id)
            .single();
            
          const { data: receiverPlantData, error: receiverPlantError } = await supabase
            .from('plants')
            .select('*')
            .eq('id', exchange.receiver_plant_id)
            .single();
            
          const { data: senderProfileData, error: senderProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', exchange.sender_id)
            .single();
            
          const { data: receiverProfileData, error: receiverProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', exchange.receiver_id)
            .single();
          
          const defaultPlant: Plant = {
            id: 'unknown',
            name: 'Unknown Plant',
            species: 'Unknown Species',
            user_id: 'unknown',
          };
          
          const defaultProfile: Profile = {
            id: 'unknown',
            username: 'Unknown User',
          };
          
          const completeExchange: Exchange = {
            id: exchange.id,
            sender_id: exchange.sender_id,
            receiver_id: exchange.receiver_id,
            sender_plant_id: exchange.sender_plant_id,
            receiver_plant_id: exchange.receiver_plant_id,
            status: status,
            created_at: exchange.created_at,
            selected_plants_ids: exchange.selected_plants_ids,
            sender_plant: senderPlantError ? defaultPlant : (senderPlantData as Plant),
            receiver_plant: receiverPlantError ? defaultPlant : (receiverPlantData as Plant),
            sender: senderProfileError ? defaultProfile : (senderProfileData as Profile),
            receiver: receiverProfileError ? defaultProfile : (receiverProfileData as Profile),
            selected_plants: undefined
          };
          
          completeExchanges.push(completeExchange);
        }
        
        console.log("Processed exchanges:", completeExchanges);
        setExchanges(completeExchanges);
      } catch (error) {
        console.error("Unexpected error fetching exchanges:", error);
        setError("An unexpected error occurred while loading exchanges.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchanges();
  }, [user]);

  const filteredExchanges = statusFilter === 'all'
    ? exchanges
    : exchanges.filter(exchange => exchange.status === statusFilter);

  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle>Exchanges</CardTitle>
          <p className="text-sm text-muted-foreground">
            View and manage your plant exchange requests.
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select onValueChange={(value) => setStatusFilter(value as ExchangeStatus | 'all')} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="awaiting_confirmation">Awaiting Confirmation</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoading && (
            <div className="text-center py-4">
              <p>Loading exchanges...</p>
            </div>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!isLoading && !error && filteredExchanges.length === 0 && (
            <p>No exchanges found with the selected filter.</p>
          )}
          
          {!isLoading && !error && filteredExchanges.length > 0 && (
            <div className="grid gap-4">
              {filteredExchanges.map((exchange) => (
                <div key={exchange.id} className="border rounded-md p-4">
                  <h3 className="font-semibold">Exchange ID: {exchange.id}</h3>
                  <p>Status: {getStatusBadge(exchange.status)}</p>
                  <p>Sender: {exchange.sender?.username || 'N/A'}</p>
                  <p>Receiver: {exchange.receiver?.username || 'N/A'}</p>
                  <p>Sender Plant: {exchange.sender_plant?.name || 'N/A'}</p>
                  <p>Receiver Plant: {exchange.receiver_plant?.name || 'N/A'}</p>
                  <p>Created At: {new Date(exchange.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default ExchangesPage;
