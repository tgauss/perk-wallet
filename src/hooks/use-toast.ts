// Simple toast hook implementation
// In a real application, you would use something like react-hot-toast or sonner

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = (options: ToastOptions) => {
    // Simple alert implementation for now
    // Replace with proper toast library in production
    const message = options.description 
      ? `${options.title}: ${options.description}`
      : options.title;
    
    if (options.variant === 'destructive') {
      alert(`Error: ${message}`);
    } else {
      alert(message);
    }
  };

  return { toast };
}