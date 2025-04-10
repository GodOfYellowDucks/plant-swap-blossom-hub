
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
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        if (!user) {
          console.error("User not logged in.");
          return;
        }

        const { data: exchangeData, error: exchangeError } = await supabase
          .from('exchange_offers')
          .select(`
            id, sender_id, receiver_id, sender_plant_id, receiver_plant_id, status, created_at, selected_plants_ids,
            sender_plant:sender_plant_id (id, name, species, image_url, user_id),
            receiver_plant:receiver_plant_id (id, name, species, image_url, user_id),
            sender:sender_id (id, username, name, avatar_url),
            receiver:receiver_id (id, username, name, avatar_url)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (exchangeError) {
          console.error("Error fetching exchanges:", exchangeError);
          toast({
            title: "Error fetching exchanges",
            description: "Failed to load exchanges. Please try again.",
            variant: "destructive",
          });
          return;
        }

        if (exchangeData) {
          setExchanges(exchangeData as unknown as Exchange[]);
        }
      } catch (error) {
        console.error("Unexpected error fetching exchanges:", error);
        toast({
          title: "Unexpected error",
          description: "An unexpected error occurred while loading exchanges.",
          variant: "destructive",
        });
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
            <Select onValueChange={(value) => setStatusFilter(value as ExchangeStatus | 'all')}>
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
          {filteredExchanges.length > 0 ? (
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
          ) : (
            <p>No exchanges found with the selected filter.</p>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default ExchangesPage;
