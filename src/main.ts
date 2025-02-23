import { createRPCServer } from "@nikolayemrikh/rpc-ts-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { resolve } from "node:path";
import { rpcMethods } from './rpc';
import { serve } from '@hono/node-server';

const app = new Hono();

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

if (!ALLOWED_ORIGIN) {
  throw new Error('ALLOWED_ORIGIN is not set');
}

app.use('*', cors({
  origin: ALLOWED_ORIGIN,
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  credentials: true,
}));

const rootDir = resolve(__dirname, '..')

createRPCServer(
  resolve(rootDir, 'tsconfig.json'),
  rootDir,
  resolve(rootDir, 'src/rpc.ts'),
  app,
  // @ts-expect-error
  rpcMethods,
);

serve({
  fetch: app.fetch,
  port: 3000,
});

export default app;
