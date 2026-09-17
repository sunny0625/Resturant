// app/dinein/[restaurantSlug]/[qrToken]/page.tsx
import { notFound, redirect } from 'next/navigation';

type Props = {
  params: { restaurantSlug: string; qrToken: string };
};

export default async function DineInPage({ params }: Props) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
  }

  // Validate QR and get table + restaurant context
  const res = await fetch(`${baseUrl}/public/qr/${params.qrToken}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return notFound();
  }

  const data = await res.json();

  // Option A: show a landing screen with a button to continue
  // Option B: immediately redirect to menu with slug & qr in query

  // Simple immediate redirect:
  redirect(`/menu?slug=${data.restaurant.slug}&qr=${params.qrToken}`);
}