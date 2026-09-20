// store/useOrderStore.ts
import { create } from 'zustand';

interface OrderAddonInput {
  addonId: number;
  quantity: number;
}

interface CartItem {
  itemId: number;
  variationId?: number;
  quantity: number;
  addons?: OrderAddonInput[];
  specialNotes?: string;
}

interface OrderContextState {
  restaurantSlug: string | null;
  tableQrToken: string | null;
  cartItems: CartItem[];

  setContext: (slug: string, qr: string) => void;
  addItem: (item: CartItem) => void;
  updateItem: (index: number, item: CartItem) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
}

export const useOrderStore = create<OrderContextState>((set) => ({
  restaurantSlug: null,
  tableQrToken: null,
  cartItems: [],
  setContext: (slug, qr) =>
    set(() => ({ restaurantSlug: slug, tableQrToken: qr })),
  addItem: (item) =>
    set((state) => ({ cartItems: [...state.cartItems, item] })),
  updateItem: (index, item) =>
    set((state) => ({
      cartItems: state.cartItems.map((ci, i) => (i === index ? item : ci)),
    })),
  removeItem: (index) =>
    set((state) => ({
      cartItems: state.cartItems.filter((_ci, i) => i !== index),
    })),
  clearCart: () => set({ cartItems: [] }),
}));