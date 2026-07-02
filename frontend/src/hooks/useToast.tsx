import toast from "react-hot-toast";

// Error toasts are keyed by their message so identical failures (e.g. many
// components hitting the same rate limit at once) collapse into ONE toast
// instead of stacking.
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
        toast.error(message, { id: message });
        break;
      default:
        toast(message);
    }
  };

  return {
    showToast,
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message, { id: message }),
    info: (message: string) => toast(message),
    removeToast: toast.dismiss
  };
};

export default useToast; 