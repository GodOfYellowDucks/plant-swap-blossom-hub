
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xyivxhkmirleuhpkbwcw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5aXZ4aGttaXJsZXVocGtid2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMjA5NTYsImV4cCI6MjA1OTc5Njk1Nn0.BrIeVBJX4G-powlYAX9ZM1X6HlvxC4kxM04gXtVtmtQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Helper function to ensure storage buckets exist
export const ensureStorageBuckets = async () => {
  try {
    // Check if the buckets exist
    const { data: buckets } = await supabase.storage.listBuckets();
    
    // Check for plants bucket
    if (!buckets?.some(bucket => bucket.name === 'plants')) {
      await supabase.storage.createBucket('plants', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      console.log('Created plants bucket');
    }
    
    // Check for avatars bucket
    if (!buckets?.some(bucket => bucket.name === 'avatars')) {
      await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      console.log('Created avatars bucket');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring storage buckets:', error);
    return false;
  }
};
