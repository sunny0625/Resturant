import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const app = express();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
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
    console.error('Error resolving QR:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public menu for a restaurant
app.get('/public/restaurants/:restaurantSlug/menu', async (req: Request, res: Response) => {
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
    console.error('Error fetching menu:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
});