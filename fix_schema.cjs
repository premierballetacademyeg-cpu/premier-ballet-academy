const fs = require('fs');
let code = fs.readFileSync('drizzle/schema.ts', 'utf-8');

code = code.replace(/(\w+):\s*varchar\(,\s*\{ length: 255 \}\)/g, '$1: varchar("$1", { length: 255 })');
code = code.replace(/import\s*\{([^}]*)\}\s*from\s*"drizzle-orm\/pg-core";/g, (match, imports) => {
  let newImports = imports.replace(/mysqlEnum|int/g, '').split(',').map(s => s.trim()).filter(Boolean);
  newImports.push('serial', 'integer');
  return 'import { ' + Array.from(new Set(newImports)).join(', ') + ' } from "drizzle-orm/pg-core";';
});
// also fix int("id") -> integer("id") if any
code = code.replace(/int\(/g, 'integer(');
// also remove onUpdateNow() since postgres doesn't have it natively on timestamp like mysql
code = code.replace(/\.onUpdateNow\(\)/g, '');

fs.writeFileSync('drizzle/schema.ts', code);
console.log('Fixed syntax errors');
