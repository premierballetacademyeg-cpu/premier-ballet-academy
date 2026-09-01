import 'dotenv/config';
import { getDb } from './server/db';
import { families } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  
  const allFamilies = await db.select().from(families);
  
  for (const family of allFamilies) {
    if (family.guardianPhone) {
      let cleanPhone = family.guardianPhone.replace(/\D/g, '');
      
      if (cleanPhone.startsWith('200')) {
        cleanPhone = '20' + cleanPhone.substring(3);
      } else if (cleanPhone.startsWith('0')) {
        cleanPhone = '20' + cleanPhone.substring(1);
      } else if (!cleanPhone.startsWith('20')) {
        cleanPhone = '20' + cleanPhone;
      }

      if (cleanPhone !== family.guardianPhone) {
        await db.update(families)
          .set({ guardianPhone: cleanPhone })
          .where(eq(families.id, family.id));
      }
    }
  }
  
  console.log("Finished fixing phones in DB!");
  process.exit(0);
}
main();
