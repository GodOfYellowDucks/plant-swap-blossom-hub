
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface SafeCommandWrapperProps {
  children: React.ReactNode;
}

/**
 * A wrapper component that provides safety for components that might
 * encounter issues with undefined values during rendering
 */
const SafeCommandWrapper: React.FC<SafeCommandWrapperProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure everything is loaded
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-plant-500" />
      </div>
    );
  }

  return (
    <React.Suspense fallback={
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-plant-500" />
      </div>
    }>
      {children}
    </React.Suspense>
  );
};

export default SafeCommandWrapper;
