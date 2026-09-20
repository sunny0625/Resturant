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

type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_KITCHEN'
  | 'SERVED'
  | 'CLOSED'
  | 'CANCELLED';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  async function loadOrders(status: string): Promise<AdminOrder[]> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const res = await fetch(
      `${baseUrl}/admin/orders?status=${status}`,
      {
        cache: 'no-store',
        headers: { 'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN! },
      }
    );
    if (!res.ok) return [];
    return res.json();
  }

  useEffect(() => {
    loadOrders(statusFilter).then(setOrders);
  }, [statusFilter]);

  async function updateStatus(id: number, status: OrderStatus) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const res = await fetch(`${baseUrl}/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN!,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setOrders(await loadOrders(statusFilter));
  }

  return (
    <main className="page-shell">
      <header className="page-heading">
        <div><p className="eyebrow">Staff operations</p><h1>Live orders</h1><p className="muted-copy">Move orders through the service workflow.</p></div>
        <select className="select-control"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="PENDING">PENDING</option>
        <option value="ACCEPTED">ACCEPTED</option>
        <option value="IN_KITCHEN">IN_KITCHEN</option>
        <option value="SERVED">SERVED</option>
        <option value="CLOSED">CLOSED</option>
      </select>
      </header>

      <ul className="content-card staff-list">
        {orders.map((o) => (
          <li key={o.id}>
            <div><strong>#{o.id} · {o.tableName}</strong><span>{o.status} · ₹{o.total}</span></div>
            {o.status === 'PENDING' && (
              <>
                <button className="small-action" onClick={() => updateStatus(o.id, 'ACCEPTED')}>
                  Accept
                </button>
                <button className="small-action danger" onClick={() => updateStatus(o.id, 'CANCELLED')}>
                  Cancel
                </button>
              </>
            )}
            {o.status === 'ACCEPTED' && (
              <button className="small-action" onClick={() => updateStatus(o.id, 'IN_KITCHEN')}>
                Send to kitchen
              </button>
            )}
            {o.status === 'IN_KITCHEN' && (
              <button className="small-action" onClick={() => updateStatus(o.id, 'SERVED')}>
                Mark served
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}