
// Types for exchange-related entities
export type ExchangeStatus = 'pending' | 'awaiting_confirmation' | 'completed' | 'cancelled';

export interface Plant {
  id: string;
  name: string;
  species: string;
  image_url?: string;
  user_id: string;
  status?: string;
  [key: string]: any;
}

export interface Profile {
  id: string;
  username: string;
  name?: string;
  avatar_url?: string;
  [key: string]: any;
}

export interface Exchange {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_plant_id: string;
  receiver_plant_id: string;
  status: ExchangeStatus;
  created_at: string;
  selected_plants_ids: string[] | null;
  sender_plant?: Plant;
  receiver_plant?: Plant;
  sender?: Profile;
  receiver?: Profile;
  selected_plants?: Plant[];
}
