'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type MenuItem = {
  id: number;
  name: string;
  description?: string;
  basePrice: number;
  isVeg: boolean;
  spiceLevel?: number;
  imageUrl?: string;
  tags: string[];
  variations: any[];
  addons: any[];
};

type Category = {
  id: number;
  name: string;
  slug: string;
  items: MenuItem[];
};

type CartItem = {
  itemId: number;
  variationId?: number;
  quantity: number;
  addons?: { addonId: number; quantity: number }[];
  specialNotes?: string;
};

export default function MenuPage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const qr = searchParams.get('qr');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    async function loadMenu() {
      if (!slug) return;
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const res = await fetch(`${baseUrl}/public/restaurants/${slug}/menu`);
      const data = await res.json();
      setCategories(data.categories);
      setLoading(false);
    }
    loadMenu();
  }, [slug]);

  function addToCart(itemId: number, variationId?: number) {
    setCart((prev) => {
      const existing = prev.find(
        (ci) => ci.itemId === itemId && ci.variationId === variationId
      );
      if (existing) {
        return prev.map((ci) =>
          ci === existing ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { itemId, variationId, quantity: 1 }];
    });
  }

  // For now, keep addons and notes simple; you can add modals later.

  if (loading) {
    return <p>Loading menu...</p>;
  }

  return (
    <main>
      <h1>Menu</h1>
      <p>Restaurant: {slug}</p>
      <p>Table QR: {qr}</p>

      {categories.map((cat) => (
        <section key={cat.id}>
          <h2>{cat.name}</h2>
          {cat.items.map((item) => (
            <div key={item.id}>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p>Base price: ₹{item.basePrice}</p>
              <button onClick={() => addToCart(item.id)}>Add</button>
            </div>
          ))}
        </section>
      ))}

      <a
        href={`/cart?slug=${slug}&qr=${qr}`}
        style={{ display: 'block', marginTop: '1rem' }}
      >
        Go to Cart ({cart.reduce((sum, ci) => sum + ci.quantity, 0)} items)
      </a>
    </main>
  );
}