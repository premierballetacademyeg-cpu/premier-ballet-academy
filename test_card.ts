import { generateAndSendVirtualCard } from "./server/email";
async function run() {
  await generateAndSendVirtualCard("Test Student", "PBA-123456", "member", "test@example.com");
}
run();
