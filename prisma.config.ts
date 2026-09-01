// Prisma 7 configuration: use DIRECT_URL for migrations (unpooled Neon),
// and DATABASE_URL (pooled) for the app runtime via server/prisma.ts.
import 'dotenv/config';
import path from 'path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});
