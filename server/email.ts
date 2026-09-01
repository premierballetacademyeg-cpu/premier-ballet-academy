import nodemailer from "nodemailer";
import { Jimp, loadFont } from "jimp";
import { SANS_32_BLACK, SANS_64_BLACK } from "jimp/fonts";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { getDb } from "./db.js";
import { cardEmailDeliveries } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateAndSendVirtualCard(
  childName: string,
  memberId: string,
  membersDbId: number,
  tier: "member" | "loyalty_member",
  parentEmail: string
) {
  const db = await getDb();
  
  // Initialize or get email delivery record
  let deliveryRecord = null;
  if (db) {
    const existing = await db
      .select()
      .from(cardEmailDeliveries)
      .where(eq(cardEmailDeliveries.memberId, membersDbId))
      .limit(1);
    
    deliveryRecord = existing[0];
    
    if (!deliveryRecord) {
      const created = await db
        .insert(cardEmailDeliveries)
        .values({
          memberId: membersDbId,
          recipientEmail: parentEmail,
          status: "pending",
          attemptCount: 0,
        })
        .returning();
      deliveryRecord = created[0];
    }
  }

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
      
      // Update delivery record as failed
      if (db && deliveryRecord) {
        await db
          .update(cardEmailDeliveries)
          .set({
            status: "failed",
            lastError: "Missing email credentials",
            lastAttemptAt: new Date(),
            attemptCount: (deliveryRecord.attemptCount || 0) + 1,
          })
          .where(eq(cardEmailDeliveries.id, deliveryRecord.id));
      }
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
    
    // Update delivery record as sent
    if (db && deliveryRecord) {
      await db
        .update(cardEmailDeliveries)
        .set({
          status: "sent",
          sentAt: new Date(),
          lastAttemptAt: new Date(),
          attemptCount: (deliveryRecord.attemptCount || 0) + 1,
          lastError: null,
        })
        .where(eq(cardEmailDeliveries.id, deliveryRecord.id));
    }
    
    return true;
  } catch (error) {
    console.error("[Email] Failed to generate/send virtual card:", error);
    
    // Update delivery record as failed
    if (db && deliveryRecord) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await db
        .update(cardEmailDeliveries)
        .set({
          status: "failed",
          lastError: errorMessage,
          lastAttemptAt: new Date(),
          attemptCount: (deliveryRecord.attemptCount || 0) + 1,
        })
        .where(eq(cardEmailDeliveries.id, deliveryRecord.id));
    }
    
    return false;
  }
}
