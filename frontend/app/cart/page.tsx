'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MenuItemDetail } from '@/components/MenuItemDetail';
import type { ApiCartItem } from '@/lib/apiTypes';
import { useOrderStore } from '@/store/useOrderStore';

type MenuVariation = {
  id: number;
  name: string;
  priceDelta: number;
};

type MenuAddon = {
  id: number;
  name: string;
  priceDelta: number;
  maxQuantity?: number;
};

type MenuItem = {
  id: number;
  name: string;
  basePrice: number;
  variations: MenuVariation[];
  addons: MenuAddon[];
};

export default function CartPage() {
  const router = useRouter();
  const restaurantSlug = useOrderStore((s) => s.restaurantSlug);
  const tableQrToken = useOrderStore((s) => s.tableQrToken);
  const cartItems = useOrderStore((s) => s.cartItems);
  const updateItem = useOrderStore((s) => s.updateItem);
  const clearCart = useOrderStore((s) => s.clearCart);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadMenu() {
      if (!restaurantSlug) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const res = await fetch(
        `${baseUrl}/public/restaurants/${restaurantSlug}/menu`
      );
      if (!res.ok) return;

      const data = await res.json();
      setMenuItems(data.categories.flatMap((category: { items: MenuItem[] }) => category.items));
    }

    loadMenu();
  }, [restaurantSlug]);

  function getMenuItem(itemId: number) {
    return menuItems.find((item) => item.id === itemId);
  }

  function changeQuantity(index: number, quantity: number) {
    if (quantity < 1) return;
    updateItem(index, { ...cartItems[index], quantity });
  }

  function getEstimatedItemTotal(cartItem: ApiCartItem) {
    const menuItem = getMenuItem(cartItem.itemId);
    if (!menuItem) return null;

    const variation = menuItem.variations.find(
      (item) => item.id === cartItem.variationId
    );
    const addonTotal = (cartItem.addons ?? []).reduce((total, cartAddon) => {
      const addon = menuItem.addons.find((item) => item.id === cartAddon.addonId);
      return total + (addon ? addon.priceDelta * cartAddon.quantity : 0);
    }, 0);

    return (menuItem.basePrice + (variation?.priceDelta ?? 0) + addonTotal) * cartItem.quantity;
  }

  const estimatedTotal = cartItems.reduce<number | null>((total, cartItem) => {
    const itemTotal = getEstimatedItemTotal(cartItem);
    return total === null || itemTotal === null ? null : total + itemTotal;
  }, 0);

  async function placeOrder() {
    if (!restaurantSlug || !tableQrToken || cartItems.length === 0) {
      alert('Missing context or empty cart');
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const res = await fetch(`${baseUrl}/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantSlug,
        tableQrToken,
        items: cartItems,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Order failed', err);
      alert('Order failed');
      return;
    }

    const data = await res.json();
    const orderId = data.order.id;

    clearCart();
    router.push(`/order/${orderId}`);
  }

  return (
    <main className="page-shell">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Review before sending</p>
          <h1>Your order</h1>
          <p className="muted-copy">{restaurantSlug} · {tableQrToken}</p>
        </div>
        <span className="count-badge">{cartItems.reduce((sum, ci) => sum + ci.quantity, 0)} items</span>
      </header>

      {cartItems.length === 0 && <p className="empty-state">Your cart is empty. Return to the menu to add dishes.</p>}

      <ul className="content-card cart-list">
        {cartItems.map((ci, idx) => (
          <li key={idx}>
            <strong>{getMenuItem(ci.itemId)?.name ?? `Item #${ci.itemId}`}</strong>
            {' '}– qty {ci.quantity}
            {ci.variationId && (
              <span>
                {' '}({getMenuItem(ci.itemId)?.variations.find((v) => v.id === ci.variationId)?.name ?? `variation ${ci.variationId}`})
              </span>
            )}
            {ci.addons && ci.addons.length > 0 && (
              <ul>
                {ci.addons.map((a) => (
                  <li key={a.addonId}>
                    {getMenuItem(ci.itemId)?.addons.find((addon) => addon.id === a.addonId)?.name ?? `Addon #${a.addonId}`}: x{a.quantity}
                  </li>
                ))}
              </ul>
            )}
            <div className="cart-controls">
              <button className="icon-button"
                aria-label={`Decrease quantity for item ${ci.itemId}`}
                disabled={ci.quantity <= 1}
                onClick={() => changeQuantity(idx, ci.quantity - 1)}
              >
                −
              </button>
              <button className="icon-button" aria-label={`Increase quantity for item ${ci.itemId}`} onClick={() => changeQuantity(idx, ci.quantity + 1)}>
                +
              </button>
              {getMenuItem(ci.itemId) && (
                <button className="text-button" onClick={() => setEditingIndex(idx)}>Edit item</button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="total-row">
        Estimated total:{' '}
        {estimatedTotal === null ? 'Unavailable' : `₹${estimatedTotal.toFixed(2)}`}
      </p>

      {editingIndex !== null && getMenuItem(cartItems[editingIndex].itemId) && (
        <div className="edit-panel">
          <MenuItemDetail
            item={getMenuItem(cartItems[editingIndex].itemId)!}
            initialCartItem={cartItems[editingIndex]}
            onAddToCart={(updatedItem) => {
              updateItem(editingIndex, updatedItem);
              setEditingIndex(null);
            }}
          />
          <button className="text-button" onClick={() => setEditingIndex(null)}>Cancel</button>
        </div>
      )}

      <button className="primary-action" disabled={cartItems.length === 0} onClick={placeOrder}>
        Place Order
      </button>
    </main>
  );
}