const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf-8');

code = code.replace(/const \[wallet\][\s\S]*?as walletBalanceCents\}\)\), 0\)\` \}\)\.from\(members\);/, '');
code = code.replace(/const recent = await db[\s\S]*?desc\(transactions\.createdAt\)\)[\s\S]*?limit\(5\);/g, 'const recent = [];');
code = code.replace(/sum\(\$\{members\.0 as walletBalanceCents\}\)/g, '0');
code = code.replace(/recentTransactions:\s*recent\s*,?/g, '');
code = code.replace(/walletTotalCents:\s*Number\(wallet\.total\)\s*,?/g, '');

fs.writeFileSync('server/db.ts', code);
console.log('Fixed db.ts');
