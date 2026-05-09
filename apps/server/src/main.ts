import { createApp } from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma } from './db/prisma.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[mealping] server listening on http://localhost:${env.PORT}`);
  console.log(`[mealping] env=${env.NODE_ENV} notify=${env.NOTIFY_CHANNEL}`);
});

async function shutdown(signal: string) {
  console.log(`\n[mealping] received ${signal}, shutting down...`);
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
