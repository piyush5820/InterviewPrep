"use client";
import { createContext, useContext, useState, useCallback } from "react";
import Toast, { ToastType } from "./Toast";

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = useCallback((message: string, type: ToastType = "success") => {
        setToast({ message, type });
    }, []);

    const handleClose = () => {
        setToast(null);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && <Toast message={toast.message} type={toast.type} onClose={handleClose} />}
        </ToastContext.Provider>
    );
}