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
import { Loader2, Upload, X, Trash2, Search, Link } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  image_url: z.string().url("Введите корректный URL изображения").optional().or(z.literal('')),
});

type PlantFormValues = z.infer<typeof plantFormSchema>;

interface Plant {
  id: string;
  name: string;
  species: string;
  subspecies?: string;
  location?: string;
  description?: string;
  image_url?: string;
  status?: string;
  user_id: string;
  plant_type?: string;
  created_at: string;
}

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
  const [plant, setPlant] = useState<Plant | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [openTypePopover, setOpenTypePopover] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");

  const form = useForm<PlantFormValues>({
    resolver: zodResolver(plantFormSchema),
    defaultValues: {
      name: "",
      species: "",
      subspecies: "",
      location: "",
      description: "",
      plant_type: "",
      image_url: "",
    },
  });

  useEffect(() => {
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
          setPlant(data as Plant);
          setImageUrl(data.image_url);
          
          if (data.image_url && data.image_url.startsWith('http')) {
            setActiveTab("url");
          }
          
          form.reset({
            name: data.name,
            species: data.species,
            subspecies: data.subspecies || "",
            location: data.location || "",
            description: data.description || "",
            plant_type: data.plant_type || "other",
            image_url: data.image_url || "",
          });
        }
      } catch (error) {
        console.error('Ошибка загрузки растения:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные о растении. Пожалуйста, попробуйте снова.",
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
    form.setValue("image_url", "");
  };

  const handleImageUrlChange = (url: string) => {
    form.setValue("image_url", url);
    if (url) {
      setImageUrl(url);
      setImageFile(null);
    } else {
      setImageUrl(null);
    }
  };

  const uploadImage = async () => {
    return null;
  };

  useEffect(() => {
    if (activeTab === "upload") {
      form.setValue("image_url", "");
    } else {
      setImageFile(null);
    }
  }, [activeTab, form]);

  const onSubmit = async (values: PlantFormValues) => {
    if (!user || !plantId) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для редактирования растения.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    let plantImageUrl = plant?.image_url;

    try {
      if (activeTab === "url") {
        plantImageUrl = values.image_url || null;
      } else if (activeTab === "upload") {
        if (imageFile) {
          plantImageUrl = null;
        } else if (imageUrl === null) {
          plantImageUrl = null;
        }
      }

      const { error: updateError } = await supabase
        .from('plants')
        .update({
          name: values.name,
          species: values.species,
          subspecies: values.subspecies || null,
          location: values.location,
          description: values.description || null,
          image_url: plantImageUrl,
          plant_type: values.plant_type,
        })
        .eq('id', plantId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Ошибка обновления:', updateError);
        throw updateError;
      }
      
      toast({
        title: "Растение обновлено",
        description: "Данные о вашем растении успешно обновлены.",
      });
      
      onSaved();
    } catch (error) {
      console.error('Ошибка обновления растения:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные растения. Пожалуйста, попробуйте снова.",
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
        title: "Растение удалено",
        description: "Ваше растение успешно удалено.",
      });
      
      onSaved();
    } catch (error) {
      console.error('Ошибка удаления растения:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить растение. Пожалуйста, попробуйте снова.",
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
        <h2 className="text-xl font-semibold text-red-600">Растение не найдено</h2>
        <p className="mt-2 text-gray-600">Это растение не найдено или у вас нет прав для его редактирования.</p>
        <Button onClick={onCancel} className="mt-4">Назад</Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Редактировать растение</h2>
      
      <div className="mb-6">
        <p className="text-sm font-medium mb-2">Изображение растения</p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="upload" className="flex-1">Загрузить из файла</TabsTrigger>
            <TabsTrigger value="url" className="flex-1">Ссылка на изображение</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload">
            <div 
              className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-plant-500 bg-plant-50' : 'border-gray-300 hover:border-plant-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {imageUrl && activeTab === "upload" ? (
                <div className="relative">
                  <img 
                    src={imageUrl} 
                    alt="Предпросмотр растения" 
                    className="mx-auto max-h-48 rounded-md object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                      setUploadError("Не удалось загрузить изображение. Проверьте URL.");
                    }}
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
          </TabsContent>
          
          <TabsContent value="url">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL изображения</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/image.jpg" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            handleImageUrlChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      {field.value && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleImageUrlChange("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {imageUrl && activeTab === "url" && (
                <div className="mt-4 border rounded-md overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt="Предпросмотр по URL" 
                    className="mx-auto max-h-48 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                      setUploadError("Не удалось загрузить изображение. Проверьте URL.");
                    }}
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
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
              Удалить растение
            </Button>
            
            <div className="flex space-x-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" type="button">Отмена</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Отменить редактирование?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Вы уверены, что хотите отменить? Ваши изменения не будут сохранены.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Продолжить редактирование</AlertDialogCancel>
                    <AlertDialogAction onClick={onCancel}>Да, отменить</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить изменения
              </Button>
            </div>
          </div>
        </form>
      </Form>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить растение?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить это растение? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlantEditForm;
