
import React, { useState } from 'react';
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
import { Loader2, Upload, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const plantFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50),
  species: z.string().min(2, "Species must be at least 2 characters.").max(50),
  subspecies: z.string().max(50).optional(),
  location: z.string().min(2, "Location must be at least 2 characters.").max(50),
  description: z.string().max(500, "Description must be less than 500 characters.").optional(),
});

type PlantFormValues = z.infer<typeof plantFormSchema>;

const AddPlantForm = ({ onSaved, onCancel }: { onSaved: () => void, onCancel: () => void }) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImageUrl(event.target.result as string);
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
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImageUrl(event.target.result as string);
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

  const removeImage = () => {
    setImageFile(null);
    setImageUrl(null);
  };

  const onSubmit = async (values: PlantFormValues) => {
    if (!user) return;
    
    setIsSaving(true);
    let plantImageUrl = null;

    try {
      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `plants/${fileName}`;

        // Upload image to storage
        const { error: uploadError } = await supabase.storage
          .from('plants')
          .upload(filePath, imageFile);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('plants')
          .getPublicUrl(filePath);

        plantImageUrl = urlData.publicUrl;
      }

      // Insert new plant
      const { error: insertError } = await supabase
        .from('plants')
        .insert({
          user_id: user.id,
          name: values.name,
          species: values.species,
          subspecies: values.subspecies || null,
          location: values.location,
          description: values.description || null,
          image_url: plantImageUrl,
          status: 'available',
        });

      if (insertError) {
        throw insertError;
      }
      
      toast({
        title: "Plant Added",
        description: "Your plant has been added successfully.",
      });
      
      onSaved();
    } catch (error) {
      console.error('Error adding plant:', error);
      toast({
        title: "Error",
        description: "Failed to add plant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Add New Plant</h2>
      
      {/* Plant Image Upload */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-2">Plant Image</p>
        <div 
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
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
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={handleFileSelect}
          />
        </div>
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

          <div className="flex justify-end space-x-2 pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Adding Plant?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel? Your plant information will not be saved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue Adding</AlertDialogCancel>
                  <AlertDialogAction onClick={onCancel}>Yes, Cancel</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Plant
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddPlantForm;
