const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf-8');

// The original MySQL ones were like:
// export async function getUserByOpenId(openId: string) { ... }
// export async function upsertUser(user: InsertUser): Promise<void> { ... }
// We can just use a regex to remove the FIRST occurrence of them.

code = code.replace(/export async function getUserByOpenId[\s\S]*?return result\[0\];\s*\}/, "");
code = code.replace(/export async function upsertUser[\s\S]*?onDuplicateKeyUpdate\([\s\S]*?\}\);\s*\}/, "");

fs.writeFileSync('server/db.ts', code);
console.log("Removed duplicate MySQL auth functions");
