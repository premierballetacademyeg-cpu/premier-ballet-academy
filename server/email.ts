import nodemailer from "nodemailer";
import { Jimp, loadFont } from "jimp";
import { SANS_32_BLACK, SANS_64_BLACK } from "jimp/fonts";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateAndSendVirtualCard(
  childName: string,
  memberId: string,
  tier: "member" | "loyalty_member",
  parentEmail: string
) {
  try {
    const templateName = tier === "loyalty_member" ? "PBA - Loyalty Member.jpeg" : "PBA - Member.jpeg";
    const templatePath = path.resolve(process.cwd(), templateName);
    
    // Fallback if process.cwd() is wrong on Vercel
    const finalTemplatePath = fs.existsSync(templatePath) 
      ? templatePath 
      : path.resolve(__dirname, "../", templateName);

    const imageBuffer = fs.readFileSync(finalTemplatePath);
    const image = await Jimp.read(imageBuffer);
    
    const font = await loadFont(SANS_64_BLACK);

    image.print({
      font,
      x: 100,
      y: 100,
      text: childName
    });

    image.print({
      font,
      x: 100,
      y: 200,
      text: `ID: ${memberId}`
    });

    if (process.env.NODE_ENV === "development") {
      const previewPath = path.resolve(process.cwd(), `preview_${childName.replace(/\s+/g, '_')}.jpeg`);
      await image.write(previewPath);
      console.log(`[Email Mock] Saved virtual card to ${previewPath}`);
    } else {
      const buffer = await image.getBuffer("image/jpeg");
      console.log(`[Email Mock] Generated virtual card buffer (${buffer.length} bytes)`);
    }

    return true;
  } catch (error) {
    console.error("[Email] Failed to generate virtual card:", error);
    return false;
  }
}
