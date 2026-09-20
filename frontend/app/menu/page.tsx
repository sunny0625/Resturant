'use client';

import { useEffect, useState } from 'react';
import { useOrderStore } from '@/store/useOrderStore';

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

export default function MenuPage() {
  const restaurantSlug = useOrderStore((s) => s.restaurantSlug);
  const tableQrToken = useOrderStore((s) => s.tableQrToken);
  const addItemToCart = useOrderStore((s) => s.addItem);
  const cartItems = useOrderStore((s) => s.cartItems);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMenu() {
      if (!restaurantSlug) return;
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const res = await fetch(
        `${baseUrl}/public/restaurants/${restaurantSlug}/menu`
      );
      const data = await res.json();
      setCategories(data.categories);
      setLoading(false);
    }
    loadMenu();
  }, [restaurantSlug]);

  function addToCart(itemId: number) {
    addItemToCart({
      itemId,
      quantity: 1,
    });
  }

  if (!restaurantSlug || !tableQrToken) {
    return <p>Missing context. Please scan the QR again.</p>;
  }

  if (loading) {
    return <p>Loading menu...</p>;
  }

  return (
    <main>
      <h1>Menu – {restaurantSlug}</h1>
      <p>Table QR token: {tableQrToken}</p>

      {categories.map((cat) => (
        <section key={cat.id}>
          <h2>{cat.name}</h2>
          {cat.items.map((item) => (
            <div key={item.id}>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p>₹{item.basePrice}</p>
              <button onClick={() => addToCart(item.id)}>Add</button>
            </div>
          ))}
        </section>
      ))}

      <a href="/cart">Go to Cart ({cartItems.reduce((sum, ci) => sum + ci.quantity, 0)} items)</a>
    </main>
  );
}