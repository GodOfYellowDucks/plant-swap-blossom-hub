
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PlantGrid from '@/components/PlantGrid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPlants, Plant, getUserNotifications } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bell,
  Leaf, 
  MapPin, 
  Plus,
  Clock,
  CheckCheck,
  Settings
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  
  const [availablePlants, setAvailablePlants] = useState<Plant[]>([]);
  const [exchangedPlants, setExchangedPlants] = useState<Plant[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock user data until we integrate with Supabase
  const [userData, setUserData] = useState({
    name: user?.email?.split('@')[0] || 'Plant Lover',
    location: 'Your Location',
    bio: 'Welcome to your profile! You can add your bio here.',
    avatarUrl: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadUserData = async () => {
      setIsLoading(true);
      
      // In a real implementation, fetch user profile from Supabase
      // For now, load mock data
      const userAvailablePlants = getPlants({ ownerId: user.id, status: 'available' });
      const userExchangedPlants = getPlants({ ownerId: user.id, status: 'exchanged' });
      const userNotifications = getUserNotifications(user.id);
      
      setAvailablePlants(userAvailablePlants);
      setExchangedPlants(userExchangedPlants);
      setNotifications(userNotifications);
      
      setIsLoading(false);
    };

    loadUserData();
  }, [user, navigate]);

  const handleAddPlant = () => {
    // In the future, this will show a modal or navigate to add plant page
    toast({
      title: "Coming Soon",
      description: "Adding plants will be available soon!",
    });
  };

  const markAllNotificationsAsRead = () => {
    // In a real implementation, update notifications in Supabase
    toast({
      title: "Notifications marked as read",
      description: "All notifications have been marked as read.",
    });
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

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* User Info */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <img
                src={userData.avatarUrl || '/placeholder.svg'}
                alt={userData.name}
                className="h-32 w-32 rounded-full object-cover mb-4 bg-plant-100"
              />
              <h1 className="text-xl font-bold">{userData.name}</h1>
              <div className="flex items-center text-gray-600 text-sm mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{userData.location}</span>
              </div>
              <p className="mt-4 text-gray-700">{userData.bio}</p>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 text-xs gap-1"
                onClick={() => navigate('/profile/edit')}
              >
                <Settings className="h-3 w-3" /> 
                Edit Profile
              </Button>
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

        {/* Main Content Area */}
        <div className="md:col-span-3">
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
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Plants Tab */}
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

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Your Notifications</h2>
                {notifications.length > 0 && (
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
                  {/* Welcome notification for newly registered users */}
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
        </div>
      </div>
    </Layout>
  );
};

export default UserProfilePage;
