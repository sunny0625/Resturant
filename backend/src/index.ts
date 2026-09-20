import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient, Prisma, OrderStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import type { CreateOrderBody, OrderAddonInput } from './types';
import { createOrderSchema } from './validation/orderValidation';
import { adminAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

const app = express();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const PORT = process.env.PORT || 4000;

type CreatedOrder = Prisma.OrderGetPayload<{
  include: {
    items: true;
    table: true;
    restaurant: true;
  };
}>;

type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        item: true;
        variation: true;
      };
    };
    table: true;
    restaurant: true;
  };
}>;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'restaurant-backend' });
});

// Resolve restaurant + table from qrToken
app.get('/public/qr/:qrToken', async (req: Request, res: Response) => {
  const qrToken = req.params.qrToken as string; // ensure plain string

  try {
    type TableWithRestaurant = Prisma.TableGetPayload<{
      include: { restaurant: true };
    }>;

    const table = (await prisma.table.findUnique({
      where: { qrToken },
      include: {
        restaurant: true,
      },
    })) as TableWithRestaurant | null;

    if (!table) {
      return res.status(404).json({ error: 'Table not found for this QR' });
    }

    console.log({
      action: 'qr_resolved',
      qrToken,
      tableId: table.id,
      restaurantSlug: table.restaurant.slug,
    });

    res.json({
      table: {
        id: table.id,
        name: table.name,
        area: table.area,
      },
      restaurant: {
        id: table.restaurant.id,
        name: table.restaurant.name,
        slug: table.restaurant.slug,
      },
    });
    } catch (err) {
      console.error('Error resolving QR:', { qrToken, err });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public menu for a restaurant
app.get(
  '/public/restaurants/:restaurantSlug/menu',
  async (req: Request, res: Response) => {
    const restaurantSlug = req.params.restaurantSlug as string; // ensure plain string

    try {
      type RestaurantWithMenu = Prisma.RestaurantGetPayload<{
        include: {
          categories: {
            where?: { isActive?: boolean };
            orderBy?: { displayOrder: 'asc' };
            include: {
              items: {
                where?: { isActive?: boolean };
                orderBy?: { name: 'asc' };
                include: {
                  variations: true;
                  addons: true;
                };
              };
            };
          };
        };
      }>;

      const restaurant = (await prisma.restaurant.findUnique({
        where: { slug: restaurantSlug },
        include: {
          categories: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            include: {
              items: {
                where: { isActive: true },
                orderBy: { name: 'asc' },
                include: {
                  variations: true,
                  addons: true,
                },
              },
            },
          },
        },
      })) as RestaurantWithMenu | null;

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      res.json({
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          description: restaurant.description,
        },
        categories: restaurant.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          items: cat.items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            basePrice: item.basePrice,
            isVeg: item.isVeg,
            spiceLevel: item.spiceLevel,
            imageUrl: item.imageUrl,
            tags: item.tags,
            variations: item.variations,
            addons: item.addons,
          })),
        })),
      });
    } catch (err) {
      console.error('Error fetching menu:', { restaurantSlug, err });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Create a new order for a table
app.post('/public/orders', async (req: Request, res: Response) => {
  // Validate body against schema, then use typed data
  const parseResult = createOrderSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      details: parseResult.error.issues,
    });
  }
  const body = parseResult.data as CreateOrderBody;
  let resolvedTableId: number | undefined;

  try {
    // Basic validation (still useful for business rules)
    if (!body.restaurantSlug) {
      return res
        .status(400)
        .json({ error: 'restaurantSlug is required' });
    }
    if (
      (!body.tableQrToken && !body.tableId) ||
      !body.items ||
      body.items.length === 0
    ) {
      return res.status(400).json({
        error: 'tableQrToken or tableId and items are required',
      });
    }

    // 1. Resolve restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: body.restaurantSlug },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // 2. Resolve table (by QR token or by ID)
    let table = null;

    if (body.tableId) {
      table = await prisma.table.findFirst({
        where: {
          id: body.tableId,
          restaurantId: restaurant.id,
        },
      });
    } else if (body.tableQrToken) {
      table = await prisma.table.findFirst({
        where: {
          qrToken: body.tableQrToken,
          restaurantId: restaurant.id,
        },
      });
    }

    if (!table) {
      return res
        .status(404)
        .json({ error: 'Table not found for this restaurant' });
    }


    resolvedTableId = table?.id;
    // 3. Load menu items, variations, and addons needed to compute prices
    const itemIds = body.items.map((i) => i.itemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: itemIds },
        restaurantId: restaurant.id,
        isActive: true,
      },
      include: {
        variations: true,
        addons: true,
      },
    });

    // Map for quick lookup
    const menuItemMap = new Map<number, (typeof menuItems)[number]>();
    menuItems.forEach((mi) => menuItemMap.set(mi.id, mi));

    // 4. Compute subtotal, tax, service charge, total and prepare OrderItem data
    const taxRate = Number(restaurant.taxRate ?? 0);
    const serviceRate = Number(restaurant.serviceChargeRate ?? 0);
    type ComputedOrderItem = {
      itemId: number;
      variationId?: number;
      quantity: number;
      unitPrice: number;
      addonsJson: OrderAddonInput[];
      specialNotes?: string;
    };

    const computedItems: ComputedOrderItem[] = [];
    let subtotal = 0;

    for (const inputItem of body.items) {
      const menuItem = menuItemMap.get(inputItem.itemId);
      if (!menuItem) {
        return res.status(400).json({
          error: `Menu item ${inputItem.itemId} not found or inactive`,
        });
      }

      // Base price
      let unitPrice = Number(menuItem.basePrice); // Prisma Decimal -> number

      // Variation
      let variationId: number | undefined = undefined;
      if (inputItem.variationId) {
        const variation = menuItem.variations.find(
          (v) => v.id === inputItem.variationId
        );
        if (!variation) {
          return res.status(400).json({
            error: `Variation ${inputItem.variationId} not found for item ${inputItem.itemId}`,
          });
        }
        unitPrice += Number(variation.priceDelta);
        variationId = variation.id;
      }

      // Addons
      const addonPayload: OrderAddonInput[] = [];
      if (inputItem.addons && inputItem.addons.length > 0) {
        for (const addonInput of inputItem.addons) {
          const addon = menuItem.addons.find(
            (a) => a.id === addonInput.addonId
          );
          if (!addon) {
            return res.status(400).json({
              error: `Addon ${addonInput.addonId} not found for item ${inputItem.itemId}`,
            });
          }
          unitPrice +=
            Number(addon.priceDelta) * addonInput.quantity;
          addonPayload.push({
            addonId: addon.id,
            quantity: addonInput.quantity,
          });
        }
      }

      subtotal += unitPrice * inputItem.quantity;

      computedItems.push({
        itemId: menuItem.id,
        variationId,
        quantity: inputItem.quantity,
        unitPrice,
        addonsJson: addonPayload,
        specialNotes: inputItem.specialNotes,
      });
    }

    const tax = Number((subtotal * taxRate).toFixed(2));
    const serviceCharge = Number((subtotal * serviceRate).toFixed(2));
    const total = Number((subtotal + tax + serviceCharge).toFixed(2));

    // 5. Create order with nested items
    const order = (await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table.id,
        status: 'PENDING',
        subtotal,
        tax,
        serviceCharge,
        total,
        paymentStatus: 'UNPAID',
        items: {
          create: computedItems.map((ci) => ({
            itemId: ci.itemId,
            variationId: ci.variationId,
            quantity: ci.quantity,
            unitPrice: ci.unitPrice,
            addons: ci.addonsJson, // stored as JSON
            specialNotes: ci.specialNotes,
          })) as unknown as Prisma.OrderItemUncheckedCreateWithoutOrderInput[],
        },
      },
      include: {
        items: true,
        table: true,
        restaurant: true,
      },
    })) as CreatedOrder;

    console.log({
      action: 'order_created',
      orderId: order.id,
      tableId: table.id,
      restaurantSlug: restaurant.slug,
      subtotal,
      tax,
      serviceCharge,
      total,
    });

    // 6. Respond with order summary
    res.status(201).json({
      order: {
        id: order.id,
        status: order.status,
        subtotal: order.subtotal,
        tax: order.tax,
        serviceCharge: order.serviceCharge,
        total: order.total,
        paymentStatus: order.paymentStatus,
        table: {
          id: order.table.id,
          name: order.table.name,
        },
        restaurant: {
          id: order.restaurant.id,
          name: order.restaurant.name,
          slug: order.restaurant.slug,
        },
        items: order.items,
      },
    });
  } catch (err) {
    console.error('Error creating order:', {
      restaurantSlug: body.restaurantSlug,
      tableId: resolvedTableId,
      err,
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order status and details
app.get('/public/orders/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid order id' });
  }

  try {
    const order = (await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            item: true,
            variation: true,
          },
        },
        table: true,
        restaurant: true,
      },
    })) as OrderWithDetails | null;

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      tax: order.tax,
      serviceCharge: order.serviceCharge,
      total: order.total,
      createdAt: order.createdAt,
      table: {
        id: order.table.id,
        name: order.table.name,
      },
      restaurant: {
        id: order.restaurant.id,
        name: order.restaurant.name,
        slug: order.restaurant.slug,
      },
      items: order.items.map((oi) => ({
        id: oi.id,
        name: oi.item.name,
        quantity: oi.quantity,
        unitPrice: oi.unitPrice,
        variation: oi.variation?.name ?? null,
        addons: oi.addons,
        specialNotes: oi.specialNotes,
      })),
    });
  } catch (err) {
    console.error('Error fetching order:', { orderId: id, err });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status (staff use)
app.patch(
  '/admin/orders/:id/status',
  adminAuth,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { status } = req.body as {
      status:
        | 'PENDING'
        | 'ACCEPTED'
        | 'IN_KITCHEN'
        | 'SERVED'
        | 'CLOSED'
        | 'CANCELLED';
    };

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order id' });
    }
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    try {
      const order = await prisma.order.update({
        where: { id },
        data: { status },
      });

      console.log({ action: 'order_status_updated', orderId: id, status });
      res.json({ id: order.id, status: order.status });
    } catch (err) {
      console.error('Error updating order status:', { orderId: id, status, err });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// List orders by status for staff
app.get('/admin/orders', adminAuth, async (req: Request, res: Response) => {
  const status = ((req.query.status as string) || 'PENDING') as OrderStatus;

  try {
    const orders = await prisma.order.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      include: {
        table: true,
        restaurant: true,
        items: {
          include: {
            item: true,
            variation: true,
          },
        },
      },
    });

    res.json(
      orders.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        tableName: o.table.name,
        restaurantName: o.restaurant.name,
        items: o.items.map((item) => ({
          id: item.id,
          name: item.item.name,
          quantity: item.quantity,
          variation: item.variation?.name ?? null,
          addons: item.addons,
          specialNotes: item.specialNotes,
        })),
      }))
    );
  } catch (err) {
    console.error('Error listing orders:', { status, err });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use(errorHandler);

export { app };

if (require.main === module) {
  app.listen(PORT, () => {
    console.log({ action: 'server_started', port: PORT });
  });
}