import { useState, useCallback, useMemo } from 'react';
import { CartItem, ServiceOption } from '../VendorPage/vendor';
// import type { CartItem, ServiceOption } from '../types/vendor';

interface UseCartReturn {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (service: ServiceOption, categoryLabel: string) => void;
  removeItem: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  getQuantity: (serviceId: string) => number;
  clearCart: () => void;
}

export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((service: ServiceOption, categoryLabel: string) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.service.id === service.id);
      if (existing) {
        return prev.map((item) =>
          item.service.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { service, categoryLabel, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((serviceId: string) => {
    setItems((prev) => prev.filter((item) => item.service.id !== serviceId));
  }, []);

  const updateQuantity = useCallback((serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.service.id !== serviceId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.service.id === serviceId ? { ...item, quantity } : item
      )
    );
  }, []);

  const getQuantity = useCallback(
    (serviceId: string): number => {
      return items.find((item) => item.service.id === serviceId)?.quantity ?? 0;
    },
    [items]
  );

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((acc, item) => acc + item.service.price * item.quantity, 0),
    [items]
  );

  return {
    items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    getQuantity,
    clearCart,
  };
}