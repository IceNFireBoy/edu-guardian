import { jsxDEV } from "react/jsx-dev-runtime";
import toast from "react-hot-toast";

export const useToast = () => {
  const showToast = ({ title, message, type = 'default' }: { 
    title?: string;
    message: string;
    type?: 'success' | 'error' | 'info' | 'default';
  }) => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      default:
        toast(message);
    }
  };

  return {
    showToast,
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast(message),
    removeToast: toast.dismiss
  };
};

export default useToast; 