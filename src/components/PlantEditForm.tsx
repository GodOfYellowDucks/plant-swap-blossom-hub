
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
import { Loader2, Upload, X, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const plantFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50),
  species: z.string().min(2, "Species must be at least 2 characters.").max(50),
  subspecies: z.string().max(50).optional(),
  location: z.string().min(2, "Location must be at least 2 characters.").max(50),
  description: z.string().max(500, "Description must be less than 500 characters.").optional(),
});

type PlantFormValues = z.infer<typeof plantFormSchema>;

interface PlantEditFormProps {
  plantId: string;
  onSaved: () => void;
  onCancel: () => void;
}

const PlantEditForm = ({ plantId, onSaved, onCancel }: PlantEditFormProps) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [plant, setPlant] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const form = useForm<PlantFormValues>({
    resolver: zodResolver(plantFormSchema),
    defaultValues: {
      name: "",
      species: "",
      subspecies: "",
      location: "",
      description: "",
    },
  });

  useEffect(() => {
    // Ensure storage buckets exist when component mounts
    ensureStorageBuckets();
    
    const loadPlant = async () => {
      if (!plantId || !user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('plants')
          .select('*')
          .eq('id', plantId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          setPlant(data);
          setImageUrl(data.image_url);
          
          form.reset({
            name: data.name,
            species: data.species,
            subspecies: data.subspecies || "",
            location: data.location || "",
            description: data.description || "",
          });
        }
      } catch (error) {
        console.error('Error loading plant:', error);
        toast({
          title: "Error",
          description: "Failed to load plant data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPlant();
  }, [plantId, user, form]);

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
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    setUploadError(null);
    
    if (!file.type.startsWith('image/')) {
      setUploadError("Please upload an image file (JPEG, PNG, etc.)");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
      return;
    }
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImageUrl(null);
    setUploadError(null);
  };

  const uploadImage = async () => {
    if (!imageFile || !user) return null;
    
    try {
      // Make sure the bucket exists first
      await ensureStorageBuckets();
      
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload image to storage
      const { error: uploadError, data } = await supabase.storage
        .from('plants')
        .upload(filePath, imageFile, {
          upsert: true,
          cacheControl: '3600'
        });
      
      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('plants')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const onSubmit = async (values: PlantFormValues) => {
    if (!user || !plantId) {
      toast({
        title: "Error",
        description: "You must be logged in to edit a plant.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    let plantImageUrl = plant.image_url;

    try {
      // Upload new image if provided
      if (imageFile) {
        plantImageUrl = await uploadImage();
      } else if (imageUrl === null && plant.image_url) {
        // If image was removed, set to null
        plantImageUrl = null;
      }

      // Update plant
      const { error: updateError } = await supabase
        .from('plants')
        .update({
          name: values.name,
          species: values.species,
          subspecies: values.subspecies || null,
          location: values.location,
          description: values.description || null,
          image_url: plantImageUrl,
        })
        .eq('id', plantId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Update error details:', updateError);
        throw updateError;
      }
      
      toast({
        title: "Plant Updated",
        description: "Your plant has been updated successfully.",
      });
      
      onSaved();
    } catch (error) {
      console.error('Error updating plant:', error);
      toast({
        title: "Error",
        description: "Failed to update plant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !plantId) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', plantId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Plant Deleted",
        description: "Your plant has been deleted successfully.",
      });
      
      onSaved();
    } catch (error) {
      console.error('Error deleting plant:', error);
      toast({
        title: "Error",
        description: "Failed to delete plant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-plant-500 animate-spin" />
      </div>
    );
  }

  if (!plant && !isLoading) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-red-600">Plant Not Found</h2>
        <p className="mt-2 text-gray-600">This plant could not be found or you don't have permission to edit it.</p>
        <Button onClick={onCancel} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Edit Plant</h2>
      
      {/* Plant Image Upload */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-2">Plant Image</p>
        <div 
          className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-plant-500 bg-plant-50' : 'border-gray-300 hover:border-plant-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {imageUrl ? (
            <div className="relative">
              <img 
                src={imageUrl} 
                alt="Plant preview" 
                className="mx-auto max-h-48 rounded-md object-cover"
              />
              <Button 
                variant="destructive" 
                size="sm" 
                className="absolute top-2 right-2 h-8 w-8 p-0"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Drag and drop an image here, or click to select</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileSelect}
          />
        </div>
        {uploadError && (
          <p className="mt-2 text-sm text-red-500">{uploadError}</p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plant Name</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Swiss Cheese Plant" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="species"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Species</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Monstera Deliciosa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="subspecies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subspecies (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Variegata" {...field} />
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
                  <Input placeholder="E.g., San Francisco, CA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your plant, its condition, care requirements, etc." 
                    className="resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between pt-4">
            <Button 
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
              className="gap-1"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" />
              Delete Plant
            </Button>
            
            <div className="flex space-x-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" type="button">Cancel</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Editing Plant?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel? Your changes will not be saved.
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
          </div>
        </form>
      </Form>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plant?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this plant? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlantEditForm;
