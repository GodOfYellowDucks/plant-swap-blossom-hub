
import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
import { Loader2, Upload, X } from 'lucide-react';

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50),
  location: z.string().min(2, "Location must be at least 2 characters.").max(50),
  bio: z.string().max(300, "Bio must be less than 300 characters.").optional(),
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

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      location: "",
      bio: "",
    },
  });

  useEffect(() => {
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

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarUrl(null);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    
    setIsSaving(true);
    let newAvatarUrl = profile?.avatar_url;

    try {
      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload image to storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        newAvatarUrl = urlData.publicUrl;
      } else if (avatarUrl === null && profile?.avatar_url) {
        // If avatar was removed, delete from storage
        const avatarPath = profile.avatar_url.split('/').pop();
        if (avatarPath) {
          await supabase.storage
            .from('avatars')
            .remove([`avatars/${avatarPath}`]);
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
        <div 
          className={`relative group cursor-pointer mb-4 ${isDragging ? 'border-2 border-dashed border-plant-500 bg-plant-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl || ""} />
            <AvatarFallback className="text-xl">{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={handleFileSelect}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {avatarUrl ? 'Change profile picture' : 'Add profile picture'}
          </span>
          {avatarUrl && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={removeAvatar}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">Click or drag and drop an image</p>
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
