
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
import { Loader2, Upload, X, Search } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Типы растений
const plantTypes = [
  { value: 'indoor', label: 'Комнатные' },
  { value: 'outdoor', label: 'Уличные' },
  { value: 'succulent', label: 'Суккуленты' },
  { value: 'herb', label: 'Травы' },
  { value: 'vegetable', label: 'Овощи' },
  { value: 'fruit', label: 'Фрукты' },
  { value: 'cactus', label: 'Кактусы' },
  { value: 'flower', label: 'Цветы' },
  { value: 'tree', label: 'Деревья' },
  { value: 'shrub', label: 'Кустарники' },
  { value: 'vine', label: 'Лианы' },
  { value: 'aquatic', label: 'Водные' },
  { value: 'other', label: 'Другое' },
];

const plantFormSchema = z.object({
  name: z.string().min(2, "Название должно содержать минимум 2 символа.").max(50),
  species: z.string().min(2, "Вид должен содержать минимум 2 символа.").max(50),
  subspecies: z.string().max(50).optional(),
  location: z.string().min(2, "Местоположение должно содержать минимум 2 символа.").max(50),
  description: z.string().max(500, "Описание должно быть меньше 500 символов.").optional(),
  plant_type: z.string().min(1, "Выберите тип растения"),
});

type PlantFormValues = z.infer<typeof plantFormSchema>;

const AddPlantForm = ({ onSaved, onCancel }: { onSaved: () => void, onCancel: () => void }) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [openTypePopover, setOpenTypePopover] = useState(false);

  useEffect(() => {
    // Убедимся, что хранилище существует при монтировании компонента
    ensureStorageBuckets();
  }, []);

  const form = useForm<PlantFormValues>({
    resolver: zodResolver(plantFormSchema),
    defaultValues: {
      name: "",
      species: "",
      subspecies: "",
      location: "",
      description: "",
      plant_type: "",
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
      setUploadError("Пожалуйста, загрузите файл изображения (JPEG, PNG и т.д.)");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Размер файла должен быть меньше 5MB");
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
      // Убедимся, что хранилище существует
      await ensureStorageBuckets();
      
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Загрузка изображения в хранилище
      const { error: uploadError, data } = await supabase.storage
        .from('plants')
        .upload(filePath, imageFile, {
          upsert: true,
          cacheControl: '3600'
        });
      
      if (uploadError) {
        console.error('Ошибка загрузки:', uploadError);
        throw uploadError;
      }
      
      // Получение публичного URL
      const { data: urlData } = supabase.storage
        .from('plants')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      throw error;
    }
  };

  const onSubmit = async (values: PlantFormValues) => {
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы, чтобы добавить растение.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    let plantImageUrl = null;

    try {
      // Загрузка изображения, если оно предоставлено
      if (imageFile) {
        plantImageUrl = await uploadImage();
      }

      // Добавление нового растения
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
          plant_type: values.plant_type,
        });

      if (insertError) {
        console.error('Ошибка добавления:', insertError);
        throw insertError;
      }
      
      toast({
        title: "Растение добавлено",
        description: "Ваше растение успешно добавлено.",
      });
      
      onSaved();
    } catch (error) {
      console.error('Ошибка добавления растения:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить растение. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Добавить новое растение</h2>
      
      {/* Загрузка изображения растения */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-2">Изображение растения</p>
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
                alt="Предпросмотр растения" 
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
              <p className="text-sm text-gray-600">Перетащите изображение сюда или нажмите для выбора</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP до 5MB</p>
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
                <FormLabel>Название растения</FormLabel>
                <FormControl>
                  <Input placeholder="Например, Монстера" {...field} />
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
                <FormLabel>Вид</FormLabel>
                <FormControl>
                  <Input placeholder="Например, Monstera Deliciosa" {...field} />
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
                <FormLabel>Подвид (необязательно)</FormLabel>
                <FormControl>
                  <Input placeholder="Например, Variegata" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="plant_type"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Тип растения</FormLabel>
                <Popover open={openTypePopover} onOpenChange={setOpenTypePopover}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {field.value
                          ? plantTypes.find((type) => type.value === field.value)?.label
                          : "Выберите тип растения"}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Поиск типа растения..." />
                      <CommandEmpty>Тип не найден</CommandEmpty>
                      <CommandGroup>
                        {plantTypes.map((type) => (
                          <CommandItem
                            key={type.value}
                            value={type.value}
                            onSelect={(currentValue) => {
                              field.onChange(currentValue);
                              setOpenTypePopover(false);
                            }}
                          >
                            {type.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Местоположение</FormLabel>
                <FormControl>
                  <Input placeholder="Например, Москва" {...field} />
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
                <FormLabel>Описание (необязательно)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Опишите ваше растение, его состояние, требования по уходу и т.д." 
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
                <Button variant="outline" type="button">Отмена</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Отменить добавление растения?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Вы уверены, что хотите отменить? Информация о вашем растении не будет сохранена.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Продолжить добавление</AlertDialogCancel>
                  <AlertDialogAction onClick={onCancel}>Да, отменить</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Добавить растение
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddPlantForm;
