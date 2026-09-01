import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import Jimp from "jimp";
import path from "path";
import fs from "fs";

const SUPABASE_URL = "https://gpdxzjnjfqfchkpqptyu.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || "sb_publishable_HMHsWkaV0Y0UtKHDE6T5tw_ahmNsXkM";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url || "";
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  if (url.includes("/api/send-card")) {
    try {
      const { childName, memberId, tier, guardianEmail } = req.body || {};
      
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

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "hamdielshimi@gmail.com",
          pass: "zner gvhk lqwa vnhh"
        }
      });

      await transporter.sendMail({
        from: '"Premier Ballet Academy" <hamdielshimi@gmail.com>',
        to: guardianEmail,
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

  return res.status(404).json({ error: "Unknown endpoint", url });
}
