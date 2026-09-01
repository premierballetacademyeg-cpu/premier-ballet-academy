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
      
      // If it's an Egyptian number but has extra digits (like a trailing 0 typo)
      // For example 2012243267770 (13 digits), we only want 20 + 10 digits = 12 digits
      if (cleanPhone.startsWith('20') && cleanPhone.length > 12) {
        cleanPhone = cleanPhone.substring(0, 12);
      }

      if (cleanPhone !== family.guardianPhone) {
        await db.update(families)
          .set({ guardianPhone: cleanPhone })
          .where(eq(families.id, family.id));
      }
    }
  }
  
  console.log("Finished fixing phones in DB again!");
  process.exit(0);
}
main();
