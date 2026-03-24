/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useCallback } from "react";
import { toast } from "react-toastify";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const baseOptions = {
    position: "top-right",
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "toast-white",
    bodyClassName: "toast-white-body",
    progressClassName: "toast-white-progress",
  };

  const showSuccess = useCallback((message) => {
    toast.success(message, { ...baseOptions, autoClose: 2600 });
  }, []);

  const showError = useCallback((message) => {
    toast.error(message, { ...baseOptions, autoClose: 3200 });
  }, []);

  const showInfo = useCallback((message) => {
    toast.info(message, { ...baseOptions, autoClose: 2600 });
  }, []);

  const showWarning = useCallback((message) => {
    toast.warning(message, { ...baseOptions, autoClose: 2800 });
  }, []);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo, showWarning }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
