export interface ApiOrderAddonInput {
  addonId: number;
  quantity: number;
}

export interface ApiCartItem {
  itemId: number;
  variationId?: number;
  quantity: number;
  addons?: ApiOrderAddonInput[];
  specialNotes?: string;
}

export interface ApiCreateOrderBody {
  restaurantSlug: string;
  tableQrToken?: string;
  tableId?: number;
  items: ApiCartItem[];
}