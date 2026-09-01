import 'dotenv/config';
import { getDb } from './server/db';
import { families } from './drizzle/schema';
async function run() {
  const db = await getDb();
  const res = await db.select({ p: families.guardianPhone }).from(families);
  const odd = res.map(x => x.p).filter(p => p.length !== 12);
  console.log("Odd lengths:", odd.slice(0, 20));
  process.exit(0);
}
run();
