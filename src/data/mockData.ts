
export type Plant = {
  id: string;
  name: string;
  species: string;
  subspecies?: string;
  description: string;
  location: string;
  imageUrl: string;
  ownerId: string;
  status: 'available' | 'pending' | 'exchanged';
  type: 'cactus' | 'flower' | 'tree' | 'herb' | 'other';
  createdAt: string;
};

export type User = {
  id: string;
  username: string;
  password: string; // In real app, this would be hashed
  name: string;
  bio: string;
  location: string;
  avatarUrl: string;
  plants: string[]; // Plant IDs
  exchanges: Exchange[];
  notifications: Notification[];
};

export type Exchange = {
  id: string;
  initiatorId: string;
  receiverId: string;
  offeredPlantIds: string[];
  requestedPlantIds: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: 'exchange_offer' | 'exchange_accepted' | 'exchange_rejected' | 'exchange_completed';
  message: string;
  relatedExchangeId?: string;
  read: boolean;
  createdAt: string;
};

// Mock plants data
export const plants: Plant[] = [
  {
    id: "p1",
    name: "Monstera Deliciosa",
    species: "Monstera",
    subspecies: "Deliciosa",
    description: "Beautiful variegated monstera with unique patterns on every leaf. Well-established in an 8-inch pot.",
    location: "Seattle, WA",
    imageUrl: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80",
    ownerId: "u1",
    status: "available",
    type: "other",
    createdAt: "2023-04-01T12:00:00Z"
  },
  {
    id: "p2",
    name: "Fiddle Leaf Fig",
    species: "Ficus",
    subspecies: "Lyrata",
    description: "Healthy fiddle leaf fig with 12 large leaves. About 4 feet tall and thriving.",
    location: "Portland, OR",
    imageUrl: "https://images.unsplash.com/photo-1592170577795-da10bca6b25b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    ownerId: "u2",
    status: "available",
    type: "tree",
    createdAt: "2023-04-05T12:00:00Z"
  },
  {
    id: "p3",
    name: "Snake Plant",
    species: "Sansevieria",
    subspecies: "Trifasciata",
    description: "Low-maintenance snake plant. Perfect for beginners or busy plant parents.",
    location: "San Francisco, CA",
    imageUrl: "https://images.unsplash.com/photo-1599945394855-f0ecbe3a9b63?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    ownerId: "u3",
    status: "available",
    type: "other",
    createdAt: "2023-04-10T12:00:00Z"
  },
  {
    id: "p4",
    name: "Prickly Pear Cactus",
    species: "Opuntia",
    description: "Hardy desert cactus with beautiful seasonal flowers. Easy to propagate.",
    location: "Phoenix, AZ",
    imageUrl: "https://images.unsplash.com/photo-1621672189703-2aa3891c14af?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    ownerId: "u1",
    status: "available",
    type: "cactus",
    createdAt: "2023-04-15T12:00:00Z"
  },
  {
    id: "p5",
    name: "Peace Lily",
    species: "Spathiphyllum",
    description: "Elegant peace lily with white flowers. Great air purifier.",
    location: "Chicago, IL",
    imageUrl: "https://images.unsplash.com/photo-1593482892290-f54c7f8d4fad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    ownerId: "u2",
    status: "available",
    type: "flower",
    createdAt: "2023-04-20T12:00:00Z"
  },
  {
    id: "p6",
    name: "Pothos",
    species: "Epipremnum aureum",
    description: "Trailing pothos with variegated leaves. Very easy to care for.",
    location: "Boston, MA",
    imageUrl: "https://images.unsplash.com/photo-1572688484438-313a6e50c333?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    ownerId: "u3",
    status: "available",
    type: "other",
    createdAt: "2023-04-25T12:00:00Z"
  },
  {
    id: "p7",
    name: "Lavender",
    species: "Lavandula",
    description: "Fragrant lavender plant. Attracts pollinators and smells wonderful.",
    location: "Denver, CO",
    imageUrl: "https://images.unsplash.com/photo-1471239207236-424ff52be361?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    ownerId: "u1",
    status: "exchanged",
    type: "herb",
    createdAt: "2023-05-01T12:00:00Z"
  },
  {
    id: "p8",
    name: "ZZ Plant",
    species: "Zamioculcas",
    description: "Nearly indestructible ZZ plant. Tolerates low light and infrequent watering.",
    location: "New York, NY",
    imageUrl: "https://images.unsplash.com/photo-1594057687713-5fd74cc0508f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    ownerId: "u2",
    status: "available",
    type: "other",
    createdAt: "2023-05-05T12:00:00Z"
  },
  {
    id: "p9",
    name: "Aloe Vera",
    species: "Aloe",
    subspecies: "Vera",
    description: "Medicinal aloe plant. Great for minor burns and skin irritations.",
    location: "Austin, TX",
    imageUrl: "https://images.unsplash.com/photo-1596547609491-4929961013da?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=765&q=80",
    ownerId: "u3",
    status: "available",
    type: "other",
    createdAt: "2023-05-10T12:00:00Z"
  },
  {
    id: "p10",
    name: "Maple Bonsai",
    species: "Acer",
    description: "5-year-old maple bonsai. Requires regular pruning and care.",
    location: "Seattle, WA",
    imageUrl: "https://images.unsplash.com/photo-1584589167171-541ce45f1eea?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    ownerId: "u1",
    status: "available",
    type: "tree",
    createdAt: "2023-05-15T12:00:00Z"
  }
];

// Mock users data
export const users: User[] = [
  {
    id: "u1",
    username: "plantlover",
    password: "password123",
    name: "Alex Green",
    bio: "Urban gardener with a passion for rare houseplants. Looking to diversify my collection!",
    location: "Seattle, WA",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    plants: ["p1", "p4", "p7", "p10"],
    exchanges: [],
    notifications: [
      {
        id: "n1",
        userId: "u1",
        type: "exchange_offer",
        message: "Sam Flora wants to exchange their Fiddle Leaf Fig for your Monstera Deliciosa",
        relatedExchangeId: "e1",
        read: false,
        createdAt: "2023-06-01T12:00:00Z"
      }
    ]
  },
  {
    id: "u2",
    username: "greenthumb",
    password: "password123",
    name: "Sam Flora",
    bio: "Botanical garden volunteer and plant collector. Specializing in rare aroids and tropical plants.",
    location: "Portland, OR",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    plants: ["p2", "p5", "p8"],
    exchanges: [],
    notifications: []
  },
  {
    id: "u3",
    username: "succulentfan",
    password: "password123",
    name: "Jordan Bloom",
    bio: "Desert plant enthusiast with over 50 varieties of cacti and succulents. Looking for unusual specimens!",
    location: "San Francisco, CA",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
    plants: ["p3", "p6", "p9"],
    exchanges: [],
    notifications: []
  }
];

// Mock exchanges
export const exchanges: Exchange[] = [
  {
    id: "e1",
    initiatorId: "u2",
    receiverId: "u1",
    offeredPlantIds: ["p2"],
    requestedPlantIds: ["p1"],
    status: "pending",
    createdAt: "2023-06-01T12:00:00Z",
    updatedAt: "2023-06-01T12:00:00Z"
  }
];

// Functions to simulate API calls
let plantsData = [...plants];
let usersData = [...users];
let exchangesData = [...exchanges];
let notificationsData = usersData.flatMap(user => user.notifications);

// Get all plants (with optional filters)
export const getPlants = (
  filters?: {
    type?: string;
    location?: string;
    status?: string;
    search?: string;
    ownerId?: string;
  }
) => {
  let filteredPlants = [...plantsData];

  if (filters) {
    if (filters.type) {
      filteredPlants = filteredPlants.filter(p => p.type === filters.type);
    }
    if (filters.location) {
      filteredPlants = filteredPlants.filter(p => p.location.includes(filters.location));
    }
    if (filters.status) {
      filteredPlants = filteredPlants.filter(p => p.status === filters.status);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredPlants = filteredPlants.filter(p => 
        p.name.toLowerCase().includes(searchLower) || 
        p.species.toLowerCase().includes(searchLower) || 
        p.description.toLowerCase().includes(searchLower)
      );
    }
    if (filters.ownerId) {
      filteredPlants = filteredPlants.filter(p => p.ownerId === filters.ownerId);
    }
  }

  return filteredPlants;
};

// Get a single plant by ID
export const getPlantById = (id: string) => {
  return plantsData.find(p => p.id === id);
};

// Get a user by username and password (for login)
export const loginUser = (username: string, password: string) => {
  const user = usersData.find(u => u.username === username && u.password === password);
  if (user) {
    // In a real app, we'd return a JWT token instead of the user object with password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
};

// Get a user by ID
export const getUserById = (id: string) => {
  const user = usersData.find(u => u.id === id);
  if (user) {
    // Don't return the password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
};

// Create a new plant
export const createPlant = (plant: Omit<Plant, 'id' | 'createdAt'>) => {
  const newPlant: Plant = {
    ...plant,
    id: `p${plantsData.length + 1}`,
    createdAt: new Date().toISOString()
  };
  plantsData.push(newPlant);
  
  // Add plant to user's plants
  const user = usersData.find(u => u.id === plant.ownerId);
  if (user) {
    user.plants.push(newPlant.id);
  }
  
  return newPlant;
};

// Update a plant
export const updatePlant = (id: string, updates: Partial<Plant>) => {
  const plantIndex = plantsData.findIndex(p => p.id === id);
  if (plantIndex !== -1) {
    plantsData[plantIndex] = { ...plantsData[plantIndex], ...updates };
    return plantsData[plantIndex];
  }
  return null;
};

// Delete a plant
export const deletePlant = (id: string) => {
  const plantIndex = plantsData.findIndex(p => p.id === id);
  if (plantIndex !== -1) {
    const plant = plantsData[plantIndex];
    
    // Remove from user's plants
    const user = usersData.find(u => u.id === plant.ownerId);
    if (user) {
      user.plants = user.plants.filter(pId => pId !== id);
    }
    
    // Remove the plant
    plantsData.splice(plantIndex, 1);
    return true;
  }
  return false;
};

// Create an exchange offer
export const createExchange = (exchange: Omit<Exchange, 'id' | 'createdAt' | 'updatedAt'>) => {
  const newExchange: Exchange = {
    ...exchange,
    id: `e${exchangesData.length + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  exchangesData.push(newExchange);
  
  // Create notification for the receiver
  const newNotification: Notification = {
    id: `n${notificationsData.length + 1}`,
    userId: exchange.receiverId,
    type: 'exchange_offer',
    message: `Someone wants to exchange plants with you!`,
    relatedExchangeId: newExchange.id,
    read: false,
    createdAt: new Date().toISOString()
  };
  notificationsData.push(newNotification);
  
  // Add notification to user
  const user = usersData.find(u => u.id === exchange.receiverId);
  if (user) {
    user.notifications.push(newNotification);
  }
  
  return newExchange;
};

// Update an exchange
export const updateExchange = (id: string, updates: Partial<Exchange>) => {
  const exchangeIndex = exchangesData.findIndex(e => e.id === id);
  if (exchangeIndex !== -1) {
    const oldStatus = exchangesData[exchangeIndex].status;
    const newExchange = { 
      ...exchangesData[exchangeIndex], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    exchangesData[exchangeIndex] = newExchange;
    
    // Create notifications based on status change
    if (updates.status && updates.status !== oldStatus) {
      const exchange = exchangesData[exchangeIndex];
      
      // Determine the recipient of the notification
      let recipientId: string;
      let message: string;
      let type: Notification['type'];
      
      if (updates.status === 'accepted') {
        recipientId = exchange.initiatorId;
        message = `Your exchange offer has been accepted!`;
        type = 'exchange_accepted';
      } else if (updates.status === 'rejected') {
        recipientId = exchange.initiatorId;
        message = `Your exchange offer has been rejected.`;
        type = 'exchange_rejected';
      } else if (updates.status === 'completed') {
        // Notify both parties
        const notificationForInitiator: Notification = {
          id: `n${notificationsData.length + 1}`,
          userId: exchange.initiatorId,
          type: 'exchange_completed',
          message: `Your exchange has been completed!`,
          relatedExchangeId: exchange.id,
          read: false,
          createdAt: new Date().toISOString()
        };
        notificationsData.push(notificationForInitiator);
        
        const userInitiator = usersData.find(u => u.id === exchange.initiatorId);
        if (userInitiator) {
          userInitiator.notifications.push(notificationForInitiator);
        }
        
        // For the receiver
        recipientId = exchange.receiverId;
        message = `Your exchange has been completed!`;
        type = 'exchange_completed';
        
        // Update plant status to exchanged
        exchange.offeredPlantIds.forEach(plantId => {
          updatePlant(plantId, { status: 'exchanged' });
        });
        exchange.requestedPlantIds.forEach(plantId => {
          updatePlant(plantId, { status: 'exchanged' });
        });
      } else {
        // No notification for other status changes
        return newExchange;
      }
      
      if (recipientId && message && type) {
        const newNotification: Notification = {
          id: `n${notificationsData.length + 1}`,
          userId: recipientId,
          type,
          message,
          relatedExchangeId: exchange.id,
          read: false,
          createdAt: new Date().toISOString()
        };
        notificationsData.push(newNotification);
        
        const user = usersData.find(u => u.id === recipientId);
        if (user) {
          user.notifications.push(newNotification);
        }
      }
    }
    
    return newExchange;
  }
  return null;
};

// Get exchanges for a user
export const getUserExchanges = (userId: string) => {
  return exchangesData.filter(e => e.initiatorId === userId || e.receiverId === userId);
};

// Get notifications for a user
export const getUserNotifications = (userId: string) => {
  return notificationsData.filter(n => n.userId === userId);
};

// Mark notification as read
export const markNotificationAsRead = (id: string) => {
  const notificationIndex = notificationsData.findIndex(n => n.id === id);
  if (notificationIndex !== -1) {
    notificationsData[notificationIndex].read = true;
    
    // Update user's notifications as well
    const notification = notificationsData[notificationIndex];
    const user = usersData.find(u => u.id === notification.userId);
    if (user) {
      const userNotificationIndex = user.notifications.findIndex(n => n.id === id);
      if (userNotificationIndex !== -1) {
        user.notifications[userNotificationIndex].read = true;
      }
    }
    
    return notificationsData[notificationIndex];
  }
  return null;
};

// Current logged in user (for client-side state)
let currentUser: Omit<User, 'password'> | null = null;

export const getCurrentUser = () => currentUser;

export const setCurrentUser = (user: Omit<User, 'password'> | null) => {
  currentUser = user;
  return currentUser;
};
