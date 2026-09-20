'use client';

import { useEffect, useState } from 'react';

type AdminOrder = {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  tableName: string;
  restaurantName: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  useEffect(() => {
    async function loadOrders() {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const res = await fetch(
        `${baseUrl}/admin/orders?status=${statusFilter}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      setOrders(data);
    }
    loadOrders();
  }, [statusFilter]);

  async function updateStatus(id: number, status: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    await fetch(`${baseUrl}/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    // naive refresh
    setStatusFilter(statusFilter);
  }

  return (
    <main>
      <h1>Admin Orders</h1>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="PENDING">PENDING</option>
        <option value="ACCEPTED">ACCEPTED</option>
        <option value="IN_KITCHEN">IN_KITCHEN</option>
        <option value="SERVED">SERVED</option>
        <option value="CLOSED">CLOSED</option>
      </select>

      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            #{o.id} – {o.status} – ₹{o.total} – {o.tableName}
            <button onClick={() => updateStatus(o.id, 'ACCEPTED')}>
              Accept
            </button>
            <button onClick={() => updateStatus(o.id, 'IN_KITCHEN')}>
              To Kitchen
            </button>
            <button onClick={() => updateStatus(o.id, 'SERVED')}>
              Served
            </button>
            <button onClick={() => updateStatus(o.id, 'CLOSED')}>
              Closed
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}