const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf-8');

// PG imports
code = code.replace(/import \{ drizzle \} from "drizzle-orm\/mysql2";/, "import { drizzle } from 'drizzle-orm/node-postgres';\nimport { Pool } from 'pg';");

// Remove transactions & rename loyaltyCards
code = code.replace(/transactions,/g, '');
code = code.replace(/loyaltyCards/g, 'cards');
code = code.replace(/walletBalanceCents/g, '0 as walletBalanceCents'); // Hack for any left over selects

// Fix getDb
code = code.replace(
  /_db = drizzle\(process\.env\.DATABASE_URL\);/,
  "const pool = new Pool({ connectionString: process.env.DATABASE_URL });\n      _db = drizzle(pool);"
);

fs.writeFileSync('server/db.ts', code);
console.log('db.ts patched');
