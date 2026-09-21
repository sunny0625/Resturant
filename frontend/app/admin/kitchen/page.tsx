'use client';

import { useEffect, useState } from 'react';

type KitchenItem = {
  id: number;
  name: string;
  quantity: number;
  variation: string | null;
  addons: unknown;
  specialNotes: string | null;
};

type KitchenOrder = {
  id: number;
  status: string;
  tableName: string;
  items: KitchenItem[];
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);

  async function loadOrders(): Promise<KitchenOrder[]> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const res = await fetch(`${baseUrl}/admin/orders?status=IN_KITCHEN`, {
      cache: 'no-store',
      headers: { 'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN! },
    });
    if (!res.ok) return [];
    return res.json();
  }

  useEffect(() => {
    loadOrders().then(setOrders);
  }, []);

  async function markServed(id: number) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const res = await fetch(`${baseUrl}/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN!,
      },
      body: JSON.stringify({ status: 'SERVED' }),
    });
    if (res.ok) setOrders(await loadOrders());
  }

  return (
    <main>
      <h1>Kitchen</h1>
      {orders.length === 0 && <p>No orders in the kitchen.</p>}
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            <h2>Order #{order.id}</h2>
            <p>Table: {order.tableName}</p>
            <ul>
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.name} x{item.quantity}
                  {item.variation && ` (${item.variation})`}
                  {item.specialNotes && <p>Note: {item.specialNotes}</p>}
                </li>
              ))}
            </ul>
            <button onClick={() => markServed(order.id)}>
              Mark order served
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
