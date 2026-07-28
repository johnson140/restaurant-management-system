import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  // type: "success" | "error"
  const showToast = useCallback(
    (message, type = "success") => {
      const id = nextId++;

      setToasts((current) => [...current, { id, message, type }]);

      setTimeout(() => removeToast(id), 3500);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Usage in any component:
//   const { showToast } = useToast();
//   showToast("Menu item added");
//   showToast("Could not save item", "error");
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside a <ToastProvider>");
  }

  return context;
}
