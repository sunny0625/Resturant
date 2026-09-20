// src/types.ts

// Add-on on a single cart item (e.g. extra cheese x2)
export interface OrderAddonInput {
  addonId: number;   // ID of the addon
  quantity: number;  // how many times you add it
}

// One item inside the order (one dish, with optional variation/addons)
export interface OrderItemInput {
  itemId: number;               // ID of the menu item (dish)
  variationId?: number;         // ID of the chosen variation (e.g. Large), optional
  quantity: number;             // how many plates of this dish
  addons?: OrderAddonInput[];   // optional list of add-ons
  specialNotes?: string;        // optional notes ("less spicy", "no onion")
}

// Full order body that frontend sends to POST /public/orders
export interface CreateOrderBody {
  restaurantSlug: string;       // which restaurant
  tableQrToken?: string;        // QR token for the table (usually provided)
  tableId?: number;             // alternative: explicit table ID
  items: OrderItemInput[];      // list of dishes in the order
}