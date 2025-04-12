import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Exchange, ExchangeStatus, Plant, Profile } from '@/types/exchange';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertCircle, 
  Clock, 
  Leaf,
  User, 
  Calendar, 
  CheckCheck, 
  X, 
  ArrowLeftRight,
  Check,
  AlertTriangle,
  Loader2
} from 'lucide-react';

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="secondary" className="capitalize flex gap-1 items-center"><Clock className="h-3 w-3" /> Ожидает</Badge>;
    case "awaiting_confirmation":
      return <Badge variant="outline" className="capitalize bg-amber-500 text-white flex gap-1 items-center"><ArrowLeftRight className="h-3 w-3" /> Ожидает подтверждения</Badge>;
    case "completed":
      return <Badge variant="outline" className="capitalize bg-green-500 text-white flex gap-1 items-center"><CheckCheck className="h-3 w-3" /> Завершено</Badge>;
    case "cancelled":
      return <Badge variant="destructive" className="capitalize flex gap-1 items-center"><X className="h-3 w-3" /> Отменено</Badge>;
    default:
      return <Badge className="capitalize">{status}</Badge>;
  }
};

const ExchangesPage = () => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [statusFilter, setStatusFilter] = useState<ExchangeStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availablePlants, setAvailablePlants] = useState<Plant[]>([]);
  const [selectedPlants, setSelectedPlants] = useState<string[]>([]);
  const [selectingFor, setSelectingFor] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchExchanges = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user) {
        setError("Пожалуйста, войдите в систему, чтобы просмотреть ваши обмены");
        setIsLoading(false);
        return;
      }

      console.log("Получение обменов для пользователя:", user.id);

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
        console.error("Ошибка при получении обменов:", exchangeError);
        setError("Не удалось загрузить обмены. Пожалуйста, попробуйте снова.");
        setIsLoading(false);
        return;
      }

      if (!exchangeData || exchangeData.length === 0) {
        console.log("Обмены не найдены");
        setExchanges([]);
        setIsLoading(false);
        return;
      }

      console.log("Исходные данные обмена:", exchangeData);
      
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
        
        let selectedPlants: Plant[] = [];
        if (exchange.selected_plants_ids && exchange.selected_plants_ids.length > 0) {
          const { data: selectedPlantsData, error: selectedPlantsError } = await supabase
            .from('plants')
            .select('*')
            .in('id', exchange.selected_plants_ids);
          
          if (!selectedPlantsError && selectedPlantsData) {
            selectedPlants = selectedPlantsData;
          } else {
            console.error("Ошибка при получении выбранных растений:", selectedPlantsError);
          }
        }
        
        const defaultPlant: Plant = {
          id: 'unknown',
          name: 'Неизвестное растение',
          species: 'Неизвестный вид',
          user_id: 'unknown',
        };
        
        const defaultProfile: Profile = {
          id: 'unknown',
          username: 'Неизвестный пользователь',
        };
        
        const completeExchange: Exchange = {
          id: exchange.id,
          sender_id: exchange.sender_id,
          receiver_id: exchange.receiver_id,
          sender_plant_id: exchange.sender_plant_id,
          receiver_plant_id: exchange.receiver_plant_id,
          status: status,
          created_at: exchange.created_at,
          selected_plants_ids: exchange.selected_plants_ids || [],
          sender_plant: senderPlantError ? defaultPlant : (senderPlantData as Plant),
          receiver_plant: receiverPlantError ? defaultPlant : (receiverPlantData as Plant),
          sender: senderProfileError ? defaultProfile : (senderProfileData as Profile),
          receiver: receiverProfileError ? defaultProfile : (receiverProfileData as Profile),
          selected_plants: selectedPlants
        };
        
        completeExchanges.push(completeExchange);
      }
      
      console.log("Обработанные обмены:", completeExchanges);
      setExchanges(completeExchanges);
    } catch (error) {
      console.error("Непредвиденная ошибка при получении обменов:", error);
      setError("Произошла непредвиденная ошибка при загрузке обменов.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExchanges();
  }, [user]);

  const fetchAvailablePlants = async (userId: string) => {
    try {
      setIsActionLoading(true);
      console.log("Получение доступных растений для пользователя:", userId);
      
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'available');
      
      if (error) {
        console.error("Ошибка при получении доступных растений:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить доступные растения. Пожалуйста, попробуйте снова.",
          variant: "destructive",
        });
        return [];
      }
      
      console.log("Получены доступные растения:", data);
      return data || [];
    } catch (error) {
      console.error("Непредвиденная ошибка при получении доступных растений:", error);
      return [];
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSelectPlants = async (exchangeId: string, senderId: string) => {
    console.log("Выбор растений для обмена:", exchangeId, "отправитель:", senderId);
    
    setIsActionLoading(true);
    
    try {
      const plants = await fetchAvailablePlants(senderId);
      console.log("Полученные растения для выбора:", plants);
      
      if (plants.length === 0) {
        toast({
          title: "Нет доступных растений",
          description: "У отправителя нет доступных растений для обмена.",
          variant: "destructive",
        });
        return;
      }
      
      setAvailablePlants(plants);
      setSelectedPlants([]);
      setSelectingFor(exchangeId);
    } catch (error) {
      console.error("Ошибка при получении растений для выбора:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить растения для выбора. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePlantSelectionChange = (plantId: string) => {
    setSelectedPlants(current => {
      if (current.includes(plantId)) {
        return current.filter(id => id !== plantId);
      } else {
        return [...current, plantId];
      }
    });
  };

  const handleSubmitSelection = async () => {
    if (!selectingFor || selectedPlants.length === 0) return;
    
    setIsActionLoading(true);
    
    try {
      console.log("Обновление обмена:", selectingFor, "с выбранными растениями:", selectedPlants);
      
      const { data, error } = await supabase
        .from('exchange_offers')
        .update({
          selected_plants_ids: selectedPlants,
          status: 'awaiting_confirmation'
        })
        .eq('id', selectingFor)
        .select();
      
      if (error) {
        console.error("Ошибка при обновлении обмена:", error);
        toast({
          title: "Ошибка",
          description: `Не удалось обновить обмен: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log("Результат обновления обмена:", data);
      
      toast({
        title: "Успех",
        description: "Растения для обмена выбраны успешно.",
      });
      
      setSelectingFor(null);
      fetchExchanges();
    } catch (error) {
      console.error("Непредвиденная ошибка при обновлении обмена:", error);
      toast({
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmExchange = async (exchangeId: string) => {
    setIsActionLoading(true);
    
    try {
      const exchange = exchanges.find(e => e.id === exchangeId);
      if (!exchange) {
        toast({
          title: "Ошибка",
          description: "Обмен не найден.",
          variant: "destructive",
        });
        setIsActionLoading(false);
        return;
      }
      
      console.log("Подтверждение обмена:", exchangeId);
      
      const { data, error } = await supabase
        .from('exchange_offers')
        .update({ status: 'completed' })
        .eq('id', exchangeId)
        .select();
      
      if (error) {
        console.error("Ошибка при подтверждении обмена:", error);
        toast({
          title: "Ошибка",
          description: `Не удалось подтвердить обмен: ${error.message}`,
          variant: "destructive",
        });
        setIsActionLoading(false);
        return;
      }
      
      console.log("Результат подтверждения обмена:", data);
      
      const plantsToUpdate = [exchange.sender_plant_id, exchange.receiver_plant_id, ...(exchange.selected_plants_ids || [])];
      
      for (const plantId of plantsToUpdate) {
        const { error: plantError } = await supabase
          .from('plants')
          .update({ status: 'exchanged' })
          .eq('id', plantId);
        
        if (plantError) {
          console.error(`Ошибка при обновлении растения ${plantId}:`, plantError);
        }
      }
      
      toast({
        title: "Успех",
        description: "Обмен подтвержден успешно!",
      });
      
      fetchExchanges();
    } catch (error) {
      console.error("Непредвиденная ошибка при подтверждении обмена:", error);
      toast({
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelExchange = async (exchangeId: string) => {
    setIsActionLoading(true);
    
    try {
      console.log("Отмена обмена:", exchangeId);
      
      const { data: exchange, error: getError } = await supabase
        .from('exchange_offers')
        .select('*')
        .eq('id', exchangeId)
        .single();
      
      if (getError) {
        console.error("Ошибка при получении данных обмена:", getError);
        toast({
          title: "Ошибка",
          description: `Не удалось получить данные обмена: ${getError.message}`,
          variant: "destructive",
        });
        setIsActionLoading(false);
        return;
      }
      
      const validStatus = ['pending', 'awaiting_confirmation', 'completed', 'cancelled'];
      if (!validStatus.includes('cancelled')) {
        toast({
          title: "Ошибка системы",
          description: "Статус 'cancelled' не поддерживается. Обратитесь к администратору.",
          variant: "destructive",
        });
        setIsActionLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('exchange_offers')
        .update({ status: 'cancelled' })
        .eq('id', exchangeId)
        .select();
      
      if (error) {
        console.error("Ошибка при отмене обмена:", error);
        
        if (error.message.includes('violates check constraint')) {
          toast({
            title: "Системная ошибка",
            description: "Невозможно установить статус 'cancelled'. Используется альтернативный метод...",
            variant: "destructive",
          });
          
          const { error: deleteError } = await supabase
            .from('exchange_offers')
            .delete()
            .eq('id', exchangeId);
          
          if (deleteError) {
            console.error("Ошибка при удалении обмена:", deleteError);
            toast({
              title: "Ошибка",
              description: `Не удалось удалить обмен: ${deleteError.message}`,
              variant: "destructive",
            });
            setIsActionLoading(false);
            return;
          }
          
          toast({
            title: "Успех",
            description: "Обмен был удален из системы.",
          });
          
          fetchExchanges();
          setIsActionLoading(false);
          return;
        }
        
        toast({
          title: "Ошибка",
          description: `Не удалось отменить обмен: ${error.message}`,
          variant: "destructive",
        });
        setIsActionLoading(false);
        return;
      }
      
      console.log("Результат отмены обмена:", data);
      
      toast({
        title: "Обмен отменен",
        description: "Обмен был отменен.",
      });
      
      fetchExchanges();
    } catch (error) {
      console.error("Непредвиденная ошибка при отмене обмена:", error);
      toast({
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredExchanges = statusFilter === 'all'
    ? exchanges
    : exchanges.filter(exchange => exchange.status === statusFilter);

  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle>Обмен растениями</CardTitle>
          <p className="text-sm text-muted-foreground">
            Просмотр и управление вашими запросами на обмен растениями.
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select onValueChange={(value) => setStatusFilter(value as ExchangeStatus | 'all')} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Фильтровать по статусу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="pending">Ожидает</SelectItem>
                <SelectItem value="awaiting_confirmation">Ожидает подтверждения</SelectItem>
                <SelectItem value="completed">Завершено</SelectItem>
                <SelectItem value="cancelled">Отменено</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoading && (
            <div className="text-center py-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p>Загрузка обменов...</p>
            </div>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!isLoading && !error && filteredExchanges.length === 0 && (
            <div className="text-center py-8">
              <Leaf className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4">Обмены с выбранным фильтром не найдены.</p>
            </div>
          )}
          
          {!isLoading && !error && filteredExchanges.length > 0 && (
            <div className="grid gap-4">
              {filteredExchanges.map((exchange) => (
                <Card key={exchange.id} className="overflow-hidden border-l-4 transition-all" 
                  style={{ 
                    borderLeftColor: exchange.status === 'pending' 
                      ? '#9ca3af' 
                      : exchange.status === 'awaiting_confirmation' 
                        ? '#f59e0b' 
                        : exchange.status === 'completed' 
                          ? '#10b981' 
                          : '#ef4444' 
                  }}
                >
                  <CardHeader className="bg-muted/50 pb-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">ID: {exchange.id.substring(0, 8)}...</span>
                        {getStatusBadge(exchange.status)}
                      </h3>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> 
                        {new Date(exchange.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Отправитель:</span> 
                          <span>{exchange.sender?.username || 'Н/Д'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Предлагает:</span>
                          <span>{exchange.sender_plant?.name || 'Н/Д'}</span>
                          <span className="text-xs text-muted-foreground">({exchange.sender_plant?.species || 'Неизвестный вид'})</span>
                        </div>
                        
                        {exchange.selected_plants && exchange.selected_plants.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium mb-1">Выбранные растения:</p>
                            <ul className="pl-5 list-disc space-y-1">
                              {exchange.selected_plants.map(plant => (
                                <li key={plant.id} className="text-sm">
                                  {plant.name} <span className="text-xs text-muted-foreground">({plant.species})</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {exchange.sender_plant && exchange.sender_plant.image_url && (
                          <div className="mt-2">
                            <p className="font-medium mb-1">Фото растения:</p>
                            <img 
                              src={exchange.sender_plant.image_url} 
                              alt={exchange.sender_plant.name} 
                              className="w-32 h-32 object-cover rounded-md border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">Получатель:</span> 
                          <span>{exchange.receiver?.username || 'Н/Д'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Запрашивает:</span>
                          <span>{exchange.receiver_plant?.name || 'Н/Д'}</span>
                          <span className="text-xs text-muted-foreground">({exchange.receiver_plant?.species || 'Неизвестный вид'})</span>
                        </div>
                        
                        {exchange.receiver_plant && exchange.receiver_plant.image_url && (
                          <div className="mt-2">
                            <p className="font-medium mb-1">Фото запрашиваемого растения:</p>
                            <img 
                              src={exchange.receiver_plant.image_url} 
                              alt={exchange.receiver_plant.name} 
                              className="w-32 h-32 object-cover rounded-md border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="border-t bg-muted/30 flex flex-wrap gap-2 justify-end">
                    {isActionLoading && (
                      <div className="flex items-center mr-auto">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">Обработка...</span>
                      </div>
                    )}
                  
                    {user && exchange.status === 'pending' && exchange.receiver_id === user.id && !isActionLoading && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSelectPlants(exchange.id, exchange.sender_id)}
                        className="gap-1"
                      >
                        <Leaf className="h-4 w-4" /> Выбрать растения
                      </Button>
                    )}
                    
                    {selectingFor === exchange.id && (
                      <Popover open={true} onOpenChange={(open) => {
                        if (!open) setSelectingFor(null);
                      }}>
                        <PopoverContent className="w-80 p-0" align="end">
                          <div className="p-4 border-b">
                            <h4 className="font-medium">Выберите растения от {exchange.sender?.username}</h4>
                          </div>
                          <div className="p-4">
                            {availablePlants.length === 0 ? (
                              <div className="flex flex-col items-center justify-center p-4 text-center">
                                <AlertTriangle className="h-6 w-6 text-amber-500 mb-2" />
                                <p className="text-sm text-muted-foreground">Доступных растений не найдено.</p>
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {availablePlants.map(plant => (
                                  <div key={plant.id} className="flex items-start space-x-2 p-2 hover:bg-muted/50 rounded-md">
                                    <Checkbox 
                                      id={`plant-${plant.id}`} 
                                      checked={selectedPlants.includes(plant.id)}
                                      onCheckedChange={() => handlePlantSelectionChange(plant.id)}
                                      className="mt-1"
                                    />
                                    <label htmlFor={`plant-${plant.id}`} className="text-sm cursor-pointer flex-1">
                                      <div className="font-medium">{plant.name}</div>
                                      <div className="text-xs text-muted-foreground">{plant.species}</div>
                                      {plant.image_url && (
                                        <img 
                                          src={plant.image_url} 
                                          alt={plant.name} 
                                          className="w-20 h-20 object-cover rounded-md mt-1"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                                          }}
                                        />
                                      )}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="p-4 border-t bg-muted/30 flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectingFor(null)}
                            >
                              Отмена
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={handleSubmitSelection}
                              disabled={selectedPlants.length === 0}
                            >
                              Отправить
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                    
                    {user && exchange.status === 'awaiting_confirmation' && exchange.sender_id === user.id && !isActionLoading && (
                      <Button size="sm" variant="default" onClick={() => handleConfirmExchange(exchange.id)} className="gap-1">
                        <Check className="h-4 w-4" /> Подтвердить обмен
                      </Button>
                    )}
                    
                    {user && ['pending', 'awaiting_confirmation'].includes(exchange.status) && !isActionLoading && (
                      <Button variant="destructive" size="sm" onClick={() => handleCancelExchange(exchange.id)} className="gap-1">
                        <X className="h-4 w-4" /> Отменить
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default ExchangesPage;
