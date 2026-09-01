const fs = require('fs');
let code = fs.readFileSync('server/routers.ts', 'utf-8');

if (!code.includes("import { generateAndSendVirtualCard } from './email';")) {
  code = "import { generateAndSendVirtualCard } from './email';\n" + code;
}
code = code.replace(/import \{ generateAndSendVirtualCard \} from '\.\/email';\r?\n\s*await generateAndSendVirtualCard/g, "await generateAndSendVirtualCard");

fs.writeFileSync('server/routers.ts', code);
console.log("Fixed routers.ts imports");
