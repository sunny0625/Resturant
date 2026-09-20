'use client';

import { useRouter } from 'next/navigation';
import { useOrderStore } from '@/store/useOrderStore';

export default function CartPage() {
  const router = useRouter();
  const restaurantSlug = useOrderStore((s) => s.restaurantSlug);
  const tableQrToken = useOrderStore((s) => s.tableQrToken);
  const cartItems = useOrderStore((s) => s.cartItems);
  const clearCart = useOrderStore((s) => s.clearCart);

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
    <main>
      <h1>Cart</h1>
      <p>Restaurant: {restaurantSlug}</p>
      <p>Table: {tableQrToken}</p>

      {cartItems.length === 0 && <p>Your cart is empty.</p>}

      <ul>
        {cartItems.map((ci, idx) => (
          <li key={idx}>
            Item {ci.itemId} x {ci.quantity}
          </li>
        ))}
      </ul>

      <button disabled={cartItems.length === 0} onClick={placeOrder}>
        Place Order
      </button>
    </main>
  );
}