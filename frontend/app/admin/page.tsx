// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';

type AdminStats = {
  pendingOrders: number;
  inKitchenOrders: number;
  servedToday: number;
  closedToday: number;
  totalRevenueToday: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
        const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN;

        const res = await fetch(`${baseUrl}/admin/stats`, {
          cache: 'no-store',
          headers: adminToken
            ? {
                'x-admin-token': adminToken,
              }
            : {},
        });

        if (!res.ok) {
          setError('Failed to load dashboard stats. Check backend or admin token.');
          setLoading(false);
          return;
        }

        const data = (await res.json()) as AdminStats;
        setStats(data);
        setLoading(false);
      } catch (e) {
        console.error('Error loading admin stats:', e);
        setError('Failed to load dashboard stats. Please try again.');
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <section className="mt-4 space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Restaurant admin</h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor live orders and today&apos;s performance.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/orders"
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-brand-600"
          >
            View orders
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-200"
          >
            Back to home
          </a>
        </div>
      </div>

      {/* Body */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4">
        {loading ? (
          <p className="text-sm text-slate-300">Loading dashboard…</p>
        ) : error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : !stats ? (
          <p className="text-sm text-slate-300">No stats available.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
              <p className="text-xs text-slate-400 mb-1">Pending orders</p>
              <p className="text-2xl font-semibold text-brand-100">
                {stats.pendingOrders}
              </p>
              <a
                href="/admin/orders?status=PENDING"
                className="mt-2 inline-flex text-[11px] text-brand-100 hover:underline"
              >
                View pending →
              </a>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
              <p className="text-xs text-slate-400 mb-1">In kitchen</p>
              <p className="text-2xl font-semibold text-slate-100">
                {stats.inKitchenOrders}
              </p>
              <a
                href="/admin/orders?status=IN_KITCHEN"
                className="mt-2 inline-flex text-[11px] text-brand-100 hover:underline"
              >
                View in kitchen →
              </a>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
              <p className="text-xs text-slate-400 mb-1">Served today</p>
              <p className="text-2xl font-semibold text-slate-100">
                {stats.servedToday}
              </p>
              <a
                href="/admin/orders?status=SERVED"
                className="mt-2 inline-flex text-[11px] text-brand-100 hover:underline"
              >
                View served →
              </a>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
              <p className="text-xs text-slate-400 mb-1">Closed today</p>
              <p className="text-2xl font-semibold text-slate-100">
                {stats.closedToday}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
              <p className="text-xs text-slate-400 mb-1">Revenue today</p>
              <p className="text-2xl font-semibold text-brand-100">
                ₹{stats.totalRevenueToday.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
              <p className="text-xs text-slate-400 mb-1">Quick actions</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href="/admin/orders?status=PENDING"
                  className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-950 hover:bg-slate-200"
                >
                  Pending queue
                </a>
                <a
                  href="/admin/orders?status=IN_KITCHEN"
                  className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-950 hover:bg-slate-200"
                >
                  Kitchen board
                </a>
                <a
                  href="/admin/orders?status=SERVED"
                  className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-950 hover:bg-slate-200"
                >
                  Served history
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}