import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PlantGrid from '@/components/PlantGrid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bell,
  Leaf, 
  MapPin, 
  Plus,
  Clock,
  CheckCheck,
  Settings,
  Repeat
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import ProfileEdit from '@/components/ProfileEdit';
import AddPlantForm from '@/components/AddPlantForm';
import { supabase } from '@/integrations/supabase/client';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [availablePlants, setAvailablePlants] = useState<any[]>([]);
  const [exchangedPlants, setExchangedPlants] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [pendingExchanges, setPendingExchanges] = useState(0);
  
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
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
        
        const { data: userNotifications, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (notificationsError) throw notificationsError;
        
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
        setNotifications(userNotifications || []);
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
  }, [user, navigate, isEditing, isAddingPlant]);

  const handleAddPlant = () => {
    setIsAddingPlant(true);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (error) throw error;
      
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      
      toast({
        title: "Notifications marked as read",
        description: "All notifications have been marked as read.",
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read.",
        variant: "destructive",
      });
    }
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

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

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
          ) : (
            <Tabs defaultValue="plants" className="space-y-6">
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="plants" className="gap-2">
                    <Leaf className="h-4 w-4" />
                    My Plants
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications
                    {unreadNotificationsCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="plants" className="space-y-6">
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
                    />
                  </TabsContent>

                  <TabsContent value="exchanged" className="mt-4">
                    <PlantGrid
                      plants={exchangedPlants}
                      emptyMessage="You haven't completed any exchanges yet."
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="notifications">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Your Notifications</h2>
                  {unreadNotificationsCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllNotificationsAsRead}>
                      Mark all as read
                    </Button>
                  )}
                </div>
                
                {notifications.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Bell className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-center">
                        You're all caught up! No notifications at the moment.
                      </p>
                      <p className="text-gray-400 text-sm text-center mt-2">
                        When you receive exchange offers or updates, they'll appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    <Card className="bg-plant-50 border-plant-200">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-plant-500" />
                          Welcome to Blossom Hub
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 text-sm text-gray-600">
                        Thank you for joining our plant exchange community! Start by adding your plants and browsing available exchanges.
                      </CardContent>
                    </Card>
                    
                    {notifications.map((notification) => (
                      <Card 
                        key={notification.id} 
                        className={notification.read ? "bg-gray-50" : "border-plant-300 bg-white"}
                      >
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm font-medium flex justify-between">
                            <span>{notification.title || "Notification"}</span>
                            {!notification.read && <span className="text-xs bg-plant-100 text-plant-800 px-2 py-0.5 rounded-full">New</span>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-sm text-gray-600">
                          {notification.message}
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserProfilePage;
