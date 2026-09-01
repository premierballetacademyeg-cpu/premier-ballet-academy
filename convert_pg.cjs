const fs = require('fs');
let code = fs.readFileSync('drizzle/schema.ts', 'utf-8');

code = code.replace(/mysql-core/g, 'pg-core');
code = code.replace(/mysqlTable/g, 'pgTable');
code = code.replace(/int\("id"\)\.autoincrement\(\)/g, 'serial("id")');
code = code.replace(/int\(/g, 'integer(');
code = code.replace(/mysqlEnum\(([^,]+),\s*\[[^\]]+\]\)/g, 'varchar(, { length: 255 })');

fs.writeFileSync('drizzle/schema.ts', code);
console.log('Schema converted to Postgres!');
