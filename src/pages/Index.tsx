import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import PlantGrid from '@/components/PlantGrid';
import FilterBar from '@/components/FilterBar';
import { Leaf, MessageCircle, X, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Заготовленные ответы бота
const BOT_RESPONSES = {
  greeting: "Привет! Я бот-помощник сообщества по обмену растениями. Чем могу помочь?",
  help: "Я могу помочь вам: \n- Найти растения по названию или виду\n- Подсказать как работает обмен\n- Ответить на частые вопросы\nПросто напишите ваш вопрос!",
  exchange: "Обмен растениями работает просто:\n1. Найдите растение, которое вам нравится\n2. Предложите владельцу растение для обмена\n3. Договоритесь о встрече или доставке\n4. Обменяйтесь растениями и радуйтесь!",
  location: "Вы можете искать растения по местоположению, используя фильтр вверху страницы.",
  care: "Уход за растениями зависит от вида. Вы можете найти информацию по конкретному растению в его описании или спросить совета у владельца при обмене.",
  goodbye: "До свидания! Если у вас будут еще вопросы - я всегда здесь!",
  default: "Извините, я не совсем понял вопрос. Можете переформулировать? Я могу помочь с поиском растений, объяснить как работает обмен или ответить на другие вопросы."
};

const Index = () => {
  const [plants, setPlants] = useState<any[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Состояния для чат-бота
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, isUser: boolean}>>([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    // Загрузка всех доступных растений из Supabase
    const loadPlants = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('plants')
          .select('*')
          .eq('status', 'available');
        
        if (error) throw error;
        
        setPlants(data || []);
        setFilteredPlants(data || []);
      } catch (error) {
        console.error('Ошибка загрузки растений:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить растения. Пожалуйста, попробуйте снова.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPlants();
  }, []);

  useEffect(() => {
    // Применение фильтров
    const applyFilters = () => {
      let result = [...plants];
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        result = result.filter(
          plant => plant.name.toLowerCase().includes(searchLower) ||
                  plant.species.toLowerCase().includes(searchLower) ||
                  (plant.description && plant.description.toLowerCase().includes(searchLower))
        );
      }
      
      if (location) {
        result = result.filter(
          plant => plant.location && plant.location.toLowerCase().includes(location.toLowerCase())
        );
      }
      
      setFilteredPlants(result);
    };

    applyFilters();
  }, [searchTerm, location, plants]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setLocation('');
  };

  // Обработчик отправки сообщения
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Добавляем сообщение пользователя
    const userMessage = { text: inputMessage, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Имитируем задержку ответа бота
    setTimeout(() => {
      const botResponse = generateBotResponse(inputMessage);
      setMessages(prev => [...prev, { text: botResponse, isUser: false }]);
    }, 500);
  };

  // Генерация ответа бота на основе ввода пользователя
  const generateBotResponse = (message: string) => {
    const msg = message.toLowerCase();
    
    if (msg.includes('привет') || msg.includes('здравств') || msg.includes('hi') || msg.includes('hello')) {
      return BOT_RESPONSES.greeting;
    } else if (msg.includes('помощ') || msg.includes('help') || msg.includes('умеешь') || msg.includes('можешь')) {
      return BOT_RESPONSES.help;
    } else if (msg.includes('обмен') || msg.includes('меня') || msg.includes('exchange') || msg.includes('swap')) {
      return BOT_RESPONSES.exchange;
    } else if (msg.includes('местоположен') || msg.includes('город') || msg.includes('location') || msg.includes('где')) {
      return BOT_RESPONSES.location;
    } else if (msg.includes('уход') || msg.includes('ухажив') || msg.includes('care') || msg.includes('полив')) {
      return BOT_RESPONSES.care;
    } else if (msg.includes('пока') || msg.includes('до свидан') || msg.includes('bye') || msg.includes('goodbye')) {
      return BOT_RESPONSES.goodbye;
    } else if (msg.includes('растен') || msg.includes('plant') || msg.includes('цвет')) {
      return "Вы можете искать растения по названию или виду с помощью поиска вверху страницы. Также можно фильтровать по местоположению.";
    } else {
      return BOT_RESPONSES.default;
    }
  };

  // Открытие чата с приветственным сообщением
  const handleOpenChat = () => {
    setIsChatOpen(true);
    if (messages.length === 0) {
      setMessages([{ text: BOT_RESPONSES.greeting, isUser: false }]);
    }
  };

  return (
    <Layout>
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Найдите идеальный обмен растениями
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Просматривайте растения, которыми делятся участники нашего сообщества, и найдите своего следующего зеленого компаньона. 
          Предложите одно из своих растений в обмен и пополните свою коллекцию!
        </p>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        location={location}
        setLocation={setLocation}
        onReset={handleResetFilters}
      />

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center">
            <Leaf className="h-12 w-12 text-plant-500 animate-leaf-sway" />
            <p className="mt-4 text-gray-600">Загрузка растений...</p>
          </div>
        </div>
      ) : (
        <PlantGrid 
          plants={filteredPlants} 
          emptyMessage="Не найдено растений, соответствующих вашим критериям. Попробуйте изменить фильтры."
        />
      )}
      
      {/* Кнопка чата */}
      {!isChatOpen && (
        <button 
          onClick={handleOpenChat}
          className="fixed bottom-6 right-6 bg-plant-500 text-white p-4 rounded-full shadow-lg hover:bg-plant-600 transition-colors"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      
      {/* Окно чата */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
          {/* Заголовок чата */}
          <div className="bg-plant-500 text-white p-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-medium">Помощник по растениям</h3>
            <button onClick={() => setIsChatOpen(false)} className="hover:text-plant-200">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Сообщения */}
          <div className="flex-1 p-4 overflow-y-auto max-h-96">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-3 ${message.isUser ? 'text-right' : 'text-left'}`}
              >
                <div 
                  className={`inline-block px-4 py-2 rounded-lg ${message.isUser 
                    ? 'bg-plant-500 text-white rounded-tr-none' 
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}
                >
                  {message.text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Поле ввода */}
          <div className="p-3 border-t border-gray-200 flex">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Напишите сообщение..."
              className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-plant-500"
            />
            <button
              onClick={handleSendMessage}
              className="bg-plant-500 text-white px-3 py-2 rounded-r-lg hover:bg-plant-600 transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Index;