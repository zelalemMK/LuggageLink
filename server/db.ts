import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

const connectionString = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/luggagelink';

const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

export async function testDbConnection() {
  await pool.query('SELECT 1');
}
