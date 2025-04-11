
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
  const [existingExchange, setExistingExchange] = useState<any | null>(null);
  const [showExchangeDialog, setShowExchangeDialog] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadPlantAndOwner = async () => {
      setIsLoading(true);
      try {
        // Получаем данные растения
        const { data: plantData, error: plantError } = await supabase
          .from('plants')
          .select('*')
          .eq('id', id);
        
        if (plantError) throw plantError;
        if (!plantData || plantData.length === 0) {
          setIsLoading(false);
          return;
        }
        
        // Используем первый элемент из массива
        setPlant(plantData[0]);
        
        // Получаем профиль владельца
        const { data: ownerData, error: ownerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', plantData[0].user_id);
        
        if (ownerError) throw ownerError;
        if (ownerData && ownerData.length > 0) {
          setOwner(ownerData[0]);
        }
        
        // Проверяем, есть ли существующий обмен для этого растения, если пользователь вошел в систему
        if (user) {
          const { data: exchanges, error: exchangesError } = await supabase
            .from('exchange_offers')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${plantData[0].user_id},receiver_plant_id.eq.${id}),and(receiver_id.eq.${user.id},sender_id.eq.${plantData[0].user_id},sender_plant_id.eq.${id})`)
            .maybeSingle();
          
          if (exchangesError) throw exchangesError;
          
          if (exchanges) {
            setExistingExchange(exchanges);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки деталей растения:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить информацию о растении. Пожалуйста, попробуйте снова.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPlantAndOwner();
  }, [id, user, navigate, toast]);

  const handleExchangeRequest = async () => {
    if (!user || !plant || !owner) {
      toast({
        title: "Ошибка",
        description: "Вы должны войти в систему, чтобы запросить обмен.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Получаем доступные растения от текущего пользователя, чтобы проверить, есть ли у него что предложить
      const { data: availablePlants, error: plantsError } = await supabase
        .from('plants')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'available');
        
      if (plantsError) throw plantsError;
      
      if (!availablePlants || availablePlants.length === 0) {
        toast({
          title: "Нет доступных растений",
          description: "Вам нужно добавить хотя бы одно растение, чтобы предложить обмен.",
          variant: "destructive",
        });
        return;
      }

      // Создаем предложение обмена
      const { data: exchange, error: exchangeError } = await supabase
        .from('exchange_offers')
        .insert({
          sender_id: user.id,
          receiver_id: plant.user_id,
          sender_plant_id: availablePlants[0].id, // Используем первое доступное растение для удовлетворения ограничения
          receiver_plant_id: plant.id,
          status: 'pending',
          selected_plants_ids: null // Будет заполнено, когда User2 выберет растения
        })
        .select()
        .single();
      
      if (exchangeError) throw exchangeError;
      
      console.log('Обмен создан:', exchange);
      
      // Пропускаем создание уведомления, так как, похоже, есть проблемы с RLS
      // Все равно перейдем на страницу обменов
      
      toast({
        title: "Запрос на обмен отправлен",
        description: "Ваш запрос на обмен был отправлен. Владелец выберет, какие из ваших растений он хочет получить взамен.",
      });
      
      setShowExchangeDialog(false);
      
      // Переходим на страницу обменов
      navigate('/exchanges');
    } catch (error: any) {
      console.error('Не удалось создать обмен:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось запросить обмен. Пожалуйста, попробуйте снова.",
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
            <p className="mt-4 text-gray-600">Загрузка информации о растении...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!plant || !owner) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900">Растение не найдено</h1>
          <p className="mt-2 text-gray-600">Растение, которое вы ищете, не существует или было удалено.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Вернуться на главную
          </Button>
        </div>
      </Layout>
    );
  }

  const isOwner = user && user.id === plant.user_id;
  const canExchange = user && !isOwner && plant.status === 'available';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
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
        Назад
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Изображение растения */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            <img
              src={plant.image_url}
              alt={plant.name}
              className="w-full h-auto object-cover aspect-square"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
        </div>

        {/* Подробности о растении */}
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
                {plant.status === 'available' ? 'Доступно' : 
                 plant.status === 'pending' ? 'Ожидает' : 
                 plant.status === 'exchanged' ? 'Обменено' : plant.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-plant-500" />
                <span>{plant.location || 'Нет местоположения'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-plant-500" />
                <span>Размещено {formatDate(plant.created_at)}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <UserIcon className="h-4 w-4 mr-2 text-plant-500" />
                <span>Владелец: {owner.name || owner.username || 'Пользователь'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Leaf className="h-4 w-4 mr-2 text-plant-500" />
                <span className="capitalize">{plant.type || 'Растение'}</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Описание</h2>
              <p className="text-gray-700">{plant.description || 'Описание не предоставлено.'}</p>
            </div>

            {/* Статус обмена */}
            {existingExchange && (
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {existingExchange.status === 'pending' ? (
                    <span>У вас уже есть ожидающий запрос на обмен для этого растения. Проверьте страницу обменов для обновлений.</span>
                  ) : existingExchange.status === 'accepted' ? (
                    <span>Этот обмен был принят и ожидает завершения.</span>
                  ) : (
                    <span>Этот обмен был {existingExchange.status === 'completed' ? 'завершен' : 'отменен'}.</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Кнопки действий */}
            <div className="flex flex-wrap gap-3">
              {isOwner ? (
                <>
                  <Button onClick={() => navigate(`/profile`)} variant="outline">
                    Редактировать растение
                  </Button>
                </>
              ) : canExchange ? (
                <>
                  {!existingExchange && (
                    <Dialog open={showExchangeDialog} onOpenChange={setShowExchangeDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-plant-500 hover:bg-plant-600">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Предложить обмен
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Предложить обмен</DialogTitle>
                          <DialogDescription>
                            Хотите предложить обмен на {plant.name}? Владелец сможет выбрать, какие из ваших растений он хочет получить взамен.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <DialogFooter className="mt-4">
                          <Button
                            onClick={handleExchangeRequest}
                            className="bg-plant-500 hover:bg-plant-600"
                          >
                            Отправить запрос на обмен
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {existingExchange && existingExchange.status === 'pending' && (
                    <Button variant="outline" disabled>
                      <Clock className="mr-2 h-4 w-4" />
                      Обмен в ожидании
                    </Button>
                  )}
                  
                  {existingExchange && existingExchange.status === 'accepted' && (
                    <Button variant="default" onClick={() => navigate('/exchanges')}>
                      Просмотр обмена
                    </Button>
                  )}
                </>
              ) : !user ? (
                <Button onClick={() => navigate('/login')} variant="outline">
                  Войдите, чтобы предложить обмен
                </Button>
              ) : (
                <Button disabled variant="outline">
                  {plant.status === 'exchanged' ? 'Уже обменено' : 'Недоступно'}
                </Button>
              )}
              
              <Button variant="ghost" onClick={() => navigate(`/profile/${plant.user_id}`)}>
                Посмотреть профиль владельца
              </Button>
            </div>
          </div>
          
          {/* Информация о владельце */}
          <div className="bg-white rounded-lg p-6 shadow-sm mt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-4">
                <img
                  src={owner.avatar_url}
                  alt={owner.name || 'Пользователь'}
                  className="h-16 w-16 rounded-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{owner.name || owner.username || 'Пользователь'}</h2>
                <p className="text-gray-600 text-sm">{owner.location || 'Нет местоположения'}</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-plant-600 hover:text-plant-700"
                  onClick={() => navigate(`/profile/${owner.id}`)}
                >
                  Просмотреть профиль
                </Button>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <p className="text-gray-700 text-sm line-clamp-3">
              {owner.bio || 'Этот пользователь еще не добавил информацию о себе.'}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PlantDetail;
