import { runGoogleSheetsSync } from "./server/googleSheets";

const result = await runGoogleSheetsSync(25);
console.log(JSON.stringify(result));
