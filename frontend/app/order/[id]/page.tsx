// app/order/[id]/page.tsx
type Props = { params: { id: string } };

export default async function OrderStatusPage({ params }: Props) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
  }

  const res = await fetch(`${baseUrl}/public/orders/${params.id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return (
      <main>
        <h1>Order not found</h1>
      </main>
    );
  }

  const data = await res.json();

  return (
    <main>
      <h1>Order #{data.id}</h1>
      <p>Status: {data.status}</p>
      <p>Payment: {data.paymentStatus}</p>
      <p>Total: ₹{data.total}</p>
      <p>Table: {data.table.name}</p>

      <h2>Items</h2>
      <ul>
        {data.items.map((item: any) => (
          <li key={item.id}>
            {item.quantity} x {item.name} ({item.unitPrice})
          </li>
        ))}
      </ul>
    </main>
  );
}