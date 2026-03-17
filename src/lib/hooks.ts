import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook para debouncing de valores
 * Útil para validaciones en tiempo real sin sobrecargar
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para localStorage con tipo seguro
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error saving localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}

/**
 * Hook para persistir formularios automáticamente
 */
export function useFormPersist<T extends Record<string, unknown>>(
  formKey: string,
  initialValues: T
) {
  const [formData, setFormData, clearFormData] = useLocalStorage<T>(
    `form_${formKey}`,
    initialValues
  );

  const updateField = useCallback(
    (field: keyof T, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [setFormData]
  );

  const resetForm = useCallback(() => {
    clearFormData();
  }, [clearFormData]);

  return {
    formData,
    setFormData,
    updateField,
    resetForm,
  };
}

/**
 * Hook para prevenir doble submit
 */
export function useFormSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (callback: () => Promise<void>) => {
      if (isSubmitting) return;

      setIsSubmitting(true);
      try {
        await callback();
      } finally {
        // Delay para evitar clicks rápidos
        setTimeout(() => setIsSubmitting(false), 1000);
      }
    },
    [isSubmitting]
  );

  return { isSubmitting, handleSubmit };
}

/**
 * Hook para detectar clicks fuera de un elemento
 */
export function useClickOutside<T extends HTMLElement>(
  callback: () => void
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [callback]);

  return ref;
}

/**
 * Hook para animaciones de entrada
 */
export function useMountTransition(isMounted: boolean, unmountDelay: number = 300) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isMounted && !shouldRender) {
      setShouldRender(true);
    } else if (!isMounted && shouldRender) {
      timeoutId = setTimeout(() => setShouldRender(false), unmountDelay);
    }

    return () => clearTimeout(timeoutId);
  }, [isMounted, unmountDelay, shouldRender]);

  return shouldRender;
}

/**
 * Hook para copiar al portapapeles
 */
export function useClipboard(timeout: number = 2000) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), timeout);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    },
    [timeout]
  );

  return { isCopied, copyToClipboard };
}

/**
 * Hook para manejar estado de loading con timeout
 */
export function useLoadingTimeout(initialState: boolean = false, timeout: number = 30000) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [isTimeout, setIsTimeout] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setIsTimeout(false);

    timeoutRef.current = setTimeout(() => {
      setIsTimeout(true);
      setIsLoading(false);
    }, timeout);
  }, [timeout]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isLoading, isTimeout, startLoading, stopLoading };
}
