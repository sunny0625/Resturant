import { z } from 'zod';

export const createOrderSchema = z.object({
  restaurantSlug: z.string().min(1),
  tableQrToken: z.string().optional(),
  tableId: z.number().optional(),
  items: z.array(
    z.object({
      itemId: z.number().int(),
      variationId: z.number().int().optional(),
      quantity: z.number().int().min(1),
      addons: z
        .array(
          z.object({
            addonId: z.number().int(),
            quantity: z.number().int().min(1),
          })
        )
        .optional(),
      specialNotes: z.string().max(500).optional(),
    })
  ).min(1),
});