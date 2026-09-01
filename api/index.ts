import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import Jimp from "jimp";
import path from "path";
import fs from "fs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url || "";

  // Vercel rewrites /api/send-card to this function, so req.url can be either
  // the public path or /api/index.ts. The method is the reliable discriminator.
  if (req.method === "POST") {
    try {
      const { childName, memberId, tier, guardianEmail } = req.body || {};

      if (
        typeof childName !== "string" ||
        !childName.trim() ||
        typeof memberId !== "string" ||
        !memberId.trim() ||
        !["member", "loyalty_member"].includes(tier) ||
        typeof guardianEmail !== "string" ||
        !guardianEmail.trim()
      ) {
        return res.status(400).json({ error: "childName, memberId, tier, and guardianEmail are required" });
      }
      
      const templateName = tier === "loyalty_member" ? "PBA - Loyalty Member.jpeg" : "PBA - Member.jpeg";
      const templatePath = path.resolve(process.cwd(), templateName);
      
      if (!fs.existsSync(templatePath)) {
        return res.status(500).json({ error: "Card template not found" });
      }

      const imageBuffer = fs.readFileSync(templatePath);
      const image = await Jimp.read(imageBuffer);
      const font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
      const smallFont = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

      image.print(font, 200, 350, childName);
      image.print(smallFont, 200, 450, `Member ID: ${memberId}`);
      
      const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);

      const gmailUser = process.env.GMAIL_USER?.trim();
      // App passwords are often copied from Google with spaces between groups.
      const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
      const recipientEmail = guardianEmail.trim();

      if (!gmailUser || !gmailPass) {
        return res.status(500).json({ error: "Email is not configured (missing GMAIL_USER/GMAIL_APP_PASSWORD)" });
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass
        }
      });

      await transporter.sendMail({
        from: `"Premier Ballet Academy" <${gmailUser}>`,
        to: recipientEmail,
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
            content: buffer
          }
        ]
      });

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed", url });
}
