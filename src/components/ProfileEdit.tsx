
import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from '@/contexts/AuthContext';
import { supabase, ensureStorageBuckets } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Upload, X, Link as LinkIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50),
  location: z.string().min(2, "Location must be at least 2 characters.").max(50),
  bio: z.string().max(300, "Bio must be less than 300 characters.").optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfileEdit = ({ onCancel }: { onCancel: () => void }) => {
  const { user, refreshSession } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [avatarUploadTab, setAvatarUploadTab] = useState<'file' | 'url'>('file');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      location: "",
      bio: "",
      avatar_url: "",
    },
  });

  useEffect(() => {
    // Ensure storage buckets exist when component mounts
    ensureStorageBuckets();
    
    const loadProfile = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          setProfile(data);
          setAvatarUrl(data.avatar_url);
          form.reset({
            name: data.name || "",
            location: data.location || "",
            bio: data.bio || "",
            avatar_url: data.avatar_url || "",
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, form]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setAvatarUrl(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setAvatarUrl(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUrlChange = (url: string) => {
    setAvatarUrl(url);
    setAvatarFile(null);
    form.setValue('avatar_url', url);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarUrl(null);
    form.setValue('avatar_url', '');
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    
    setIsSaving(true);
    let newAvatarUrl = profile?.avatar_url;

    try {
      // If avatar URL is provided directly, use it
      if (avatarUploadTab === 'url' && values.avatar_url) {
        newAvatarUrl = values.avatar_url;
      }
      // If file upload is selected
      else if (avatarUploadTab === 'file' && avatarFile) {
        // Ensure bucket exists first
        await ensureStorageBuckets();
        
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload image to storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            upsert: true,
            cacheControl: '3600'
          });

        if (uploadError) {
          console.error('Upload error details:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        newAvatarUrl = urlData.publicUrl;
      } 
      // If avatar was removed
      else if (avatarUrl === null && profile?.avatar_url) {
        newAvatarUrl = null;
        
        // If the previous avatar was stored in Supabase, try to delete it
        if (profile.avatar_url && profile.avatar_url.includes('supabase.co')) {
          const avatarPath = profile.avatar_url.split('/').pop();
          if (avatarPath) {
            await supabase.storage
              .from('avatars')
              .remove([`${avatarPath}`]);
          }
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          location: values.location,
          bio: values.bio,
          avatar_url: newAvatarUrl,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error details:', updateError);
        throw updateError;
      }

      await refreshSession();
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      onCancel();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-plant-500 animate-spin" />
      </div>
    );
  }

  if (!profile && !isLoading) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-red-600">Profile Not Found</h2>
        <p className="mt-2 text-gray-600">Your profile could not be found. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Edit Your Profile</h2>
      
      {/* Avatar Upload */}
      <div className="mb-6 flex flex-col items-center">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={avatarUrl || ""} />
          <AvatarFallback className="text-xl">{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <Tabs value={avatarUploadTab} onValueChange={(v) => setAvatarUploadTab(v as 'file' | 'url')} className="w-full max-w-md">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="file" className="flex items-center gap-1">
              <Upload className="h-4 w-4" /> Upload File
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-1">
              <LinkIcon className="h-4 w-4" /> Image URL
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="file">
            <div 
              className={`relative cursor-pointer mb-2 p-4 border-2 border-dashed rounded-md flex flex-col items-center ${isDragging ? 'border-plant-500 bg-plant-50' : 'border-gray-300'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-6 w-6 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Drag and drop an image here, or click to select</p>
              <p className="text-xs text-gray-400 mt-1">Supported formats: JPEG, PNG, GIF</p>
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleFileSelect}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="url">
            <div className="space-y-2">
              <Input 
                placeholder="https://example.com/image.jpg" 
                value={form.watch('avatar_url') || ''}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Enter a direct URL to an image (jpg, png, gif)</p>
            </div>
          </TabsContent>
        </Tabs>
        
        {avatarUrl && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={removeAvatar}
            className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" /> Remove Image
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Your location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell us about yourself..." 
                    className="resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Editing?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel? Your profile changes will not be saved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue Editing</AlertDialogCancel>
                  <AlertDialogAction onClick={onCancel}>Yes, Cancel</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProfileEdit;
