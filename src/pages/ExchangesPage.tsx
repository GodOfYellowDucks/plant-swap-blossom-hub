
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

        // Using explicit foreign key constraints to avoid relationship ambiguity
        const { data: exchangeData, error: exchangeError } = await supabase
          .from('exchange_offers')
          .select(`
            id, sender_id, receiver_id, status, created_at, selected_plants_ids,
            sender_plant_id, receiver_plant_id,
            plants!exchange_offers_sender_plant_id_fkey (id, name, species, image_url, user_id),
            plants!exchange_offers_receiver_plant_id_fkey (id, name, species, image_url, user_id),
            sender:sender_id (id, username, name, avatar_url),
            receiver:receiver_id (id, username, name, avatar_url)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (exchangeError) {
          console.error("Error fetching exchanges:", exchangeError);
          setError("Failed to load exchanges. Please try again.");
          setIsLoading(false);
          return;
        }

        if (exchangeData) {
          // Map the data to the Exchange type
          const mappedExchanges: Exchange[] = exchangeData.map(exchange => ({
            ...exchange,
            sender_plant: exchange.plants || null, // The sender plant
            receiver_plant: exchange.plants || null, // The receiver plant
          }));
          
          console.log("Fetched exchanges:", mappedExchanges);
          setExchanges(mappedExchanges);
        }
      } catch (error) {
        console.error("Unexpected error fetching exchanges:", error);
        setError("An unexpected error occurred while loading exchanges.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchanges();
  }, [user, toast]);

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
                  <p>Sender Plant: {exchange.plants?.name || 'N/A'}</p>
                  <p>Receiver Plant: {exchange.plants?.name || 'N/A'}</p>
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
