import 'dotenv/config';
import { getDb } from './server/db';
import xlsx from 'xlsx';
import { members, families, cards } from './drizzle/schema';
import { nanoid } from 'nanoid';

async function main() {
  const db = await getDb();
  
  // Truncate first to clean up the "Unknown" records
  await db.delete(members);
  await db.delete(families);
  await db.delete(cards);

  const workbook = xlsx.readFile('PBA_parent_data_master.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // headers are on the 4th row (index 3)
  const data = xlsx.utils.sheet_to_json(sheet, { range: 3 });
  
  console.log('Found ' + data.length + ' records in master sheet.');

  for (const row of data as any[]) {
    try {
      const childName = row['Child Name'];
      if (!childName || childName === 'Unique children' || childName === 'Source records') continue;

      const guardianName = row['Parent / Guardian Name'] || 'Unknown';
      const email = row['Parent Email'] || '';
      let phone = String(row['Parent Phone'] || '');
      if (phone && !phone.startsWith('20')) phone = '20' + phone;
      
      const familyCode = nanoid(8).toUpperCase();
      const memberCode = nanoid(8).toUpperCase();

      const familyInsert = await db.insert(families).values({
        familyCode,
        guardianName,
        guardianEmail: email,
        guardianPhone: phone,
      }).returning();

      const familyId = Number(familyInsert[0].id);

      await db.insert(members).values({
        familyId,
        memberCode,
        fullName: childName,
        normalizedName: childName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        birthDate: String(row['Birth Date / Age'] || ''),
        branch: row['Branch'] || 'Maadi',
        membershipTier: (String(row['Membership']).toLowerCase() === 'loyalty member') ? 'loyalty_member' : 'member',
        membershipStatus: 'eligible',
        policyStatus: 'not_accepted',
      });
    } catch(err) {
      console.error('Error inserting row:', err);
    }
  }
  console.log('Done seeding with REAL names.');
  process.exit(0);
}

main().catch(console.error);
