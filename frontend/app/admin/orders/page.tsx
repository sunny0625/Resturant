// app/admin/orders/page.tsx
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

const STATUS_OPTIONS = [
  'PENDING',
  'ACCEPTED',
  'IN_KITCHEN',
  'SERVED',
  'CLOSED',
  'CANCELLED',
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function loadOrders(status: string) {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN;

      const res = await fetch(`${baseUrl}/admin/orders?status=${status}`, {
        cache: 'no-store',
        headers: adminToken
          ? {
              'x-admin-token': adminToken,
            }
          : {},
      });

      if (!res.ok) {
        setError('Failed to load orders. Check admin token or backend.');
        setLoading(false);
        return;
      }

      const data = (await res.json()) as AdminOrder[];
      setOrders(data);
      setLoading(false);
    } catch (e) {
      console.error('Error loading admin orders:', e);
      setError('Failed to load orders. Please try again.');
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders(statusFilter);
  }, [statusFilter]);

  async function updateStatus(id: number, status: string) {
    try {
      setUpdatingId(id);
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN;

      const res = await fetch(`${baseUrl}/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { 'x-admin-token': adminToken } : {}),
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        console.error('Failed to update order status', await res.text());
        setUpdatingId(null);
        return;
      }

      // Refresh list with same filter
      await loadOrders(statusFilter);
      setUpdatingId(null);
    } catch (e) {
      console.error('Error updating order status:', e);
      setUpdatingId(null);
    }
  }

  return (
    <section className="mt-4 space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Staff dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            View live orders and update their status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-300">Status filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full bg-slate-900 border border-slate-700 px-3 py-1 text-xs text-slate-200"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4">
        {loading ? (
          <p className="text-sm text-slate-300">Loading orders…</p>
        ) : error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-slate-300">
            No orders with status {statusFilter.toLowerCase()}.
          </p>
        ) : (
          <ul className="space-y-3 text-sm text-slate-200">
            {orders.map((o) => (
              <li
                key={o.id}
                className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-b-0"
              >
                <div>
                  <p className="font-semibold">
                    #{o.id} – {o.tableName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {o.restaurantName} · ₹{o.total}{' '}
                    <span className="ml-2">
                      {new Date(o.createdAt).toLocaleTimeString()}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Current status:{' '}
                    <span className="font-medium text-brand-100">
                      {o.status}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      disabled={updatingId === o.id}
                      onClick={() => updateStatus(o.id, status)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        status === 'ACCEPTED'
                          ? 'bg-blue-500 text-slate-950'
                          : status === 'IN_KITCHEN'
                          ? 'bg-indigo-500 text-slate-950'
                          : status === 'SERVED'
                          ? 'bg-green-500 text-slate-950'
                          : status === 'CLOSED'
                          ? 'bg-slate-500 text-slate-950'
                          : status === 'CANCELLED'
                          ? 'bg-red-500 text-slate-950'
                          : 'bg-slate-800 text-slate-200'
                      } ${
                        updatingId === o.id ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}