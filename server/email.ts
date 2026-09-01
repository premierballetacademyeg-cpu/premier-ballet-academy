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

    const buffer = await image.getBuffer("image/jpeg");

    if (process.env.NODE_ENV === "development") {
      const previewPath = path.resolve(process.cwd(), `preview_${childName.replace(/\s+/g, '_')}.jpeg`);
      await image.write(previewPath);
      console.log(`[Email] Dev mode - saved preview to ${previewPath} (email still sent to ${parentEmail})`);
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      console.error("[Email] Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars - cannot send virtual card email");
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    await transporter.sendMail({
      from: `"Premier Ballet Academy" <${gmailUser}>`,
      to: parentEmail,
      subject: "Your Premier Ballet Academy Virtual Card",
      html: `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
          <p>Dear Parent,</p>
          <p>Thank you for submitting and confirming the School Policy. Your registration is complete!</p>
          <p>Please find attached your child's official Virtual Card. You can save this to your phone for future reference.</p>
          <p>Best regards,<br>Premier Ballet Academy</p>
        </div>
      `,
      attachments: [
        {
          filename: `PBA_Card_${memberId}.jpeg`,
          content: buffer,
        },
      ],
    });

    console.log(`[Email] Virtual card sent to ${parentEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to generate/send virtual card:", error);
    return false;
  }
}
