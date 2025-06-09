"use client";
// components/ToastProvider.js
import React, { useRef, createContext, useContext } from 'react';
import { Toast } from 'primereact/toast';

// Toast Context'ти түзүү
export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const toast = useRef(null);

    // Toast'ту көрсөтүү үчүн функция
    const showToast = (severity, summary, detail, life = 3000) => {
        if (toast.current) {
            toast.current.show({ severity, summary, detail, life });
        }
    };

    // Контекст аркылуу жеткиликтүү кылынган объект
    const value = {
        showSuccess: (detail, summary = 'Ийгиликтүү') => showToast('success', summary, detail),
        showInfo: (detail, summary = 'Маалымат') => showToast('info', summary, detail),
        showWarn: (detail, summary = 'Эскертүү') => showToast('warn', summary, detail, 5000), // Эскертүү узагыраак болсун
        showError: (detail, summary = 'Ката') => showToast('error', summary, detail, 7000) // Ката узагыраак болсун
    };

    return (
        <ToastContext.Provider value={value}>
        <Toast ref={toast} />
    {children}
    </ToastContext.Provider>
);
};

// Custom hook: башка компоненттерден Toast'ту колдонуу үчүн
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};