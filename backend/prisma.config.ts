import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Path to your schema
  schema: 'prisma/schema.prisma',

  // Where migrations will be stored
  migrations: {
    path: 'prisma/migrations',
    seed: './node_modules/.bin/ts-node prisma/seed.ts',
  },

  // Datasource URL now lives here, not in schema.prisma
  datasource: {
    url: env('DATABASE_URL'),
  },
});
