import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = "https://gpdxzjnjfqfchkpqptyu.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || "sb_publishable_HMHsWkaV0Y0UtKHDE6T5tw_ahmNsXkM";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url || "";
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // LIST PARENTS
  if (url.includes("/api/trpc/listParents")) {
    try {
      const inputParam = req.query?.input as string | undefined;
      let query = "";
      if (inputParam) { try { query = JSON.parse(inputParam)?.query || ""; } catch {} }

      const { data: families, error: fErr } = await supabase
        .from("families")
        .select("id, familyCode, guardianName, guardianPhone, guardianEmail")
        .order("id", { ascending: true }).limit(500);
      if (fErr) throw fErr;

      const { data: members, error: mErr } = await supabase
        .from("members")
        .select("familyId, fullName, membershipTier, policyStatus").limit(500);
      if (mErr) throw mErr;

      const memberMap = new Map((members || []).map((m: any) => [m.familyId, m]));
      let records = (families || []).map((f: any) => {
        const m: any = memberMap.get(f.id) || {};
        return { id: f.id, familyCode: f.familyCode, guardianName: f.guardianName, guardianPhone: f.guardianPhone, guardianEmail: f.guardianEmail, childName: m.fullName || "", membershipTier: m.membershipTier || "", policyStatus: m.policyStatus || "", token: f.familyCode, phone: f.guardianPhone };
      });
      if (query) {
        const q = query.toLowerCase();
        records = records.filter((r: any) => [r.familyCode, r.childName, r.guardianName, r.guardianPhone, r.policyStatus].some((v) => String(v || "").toLowerCase().includes(q)));
      }
      return res.status(200).json({ result: { data: records } });
    } catch (err: any) { return res.status(500).json({ error: err.message }); }
  }

  // ADD NEW PARENT
  if (url.includes("/api/trpc/addParent")) {
    try {
      const body = req.body || {};
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const { data: family, error: fErr } = await supabase.from("families").insert({ familyCode: code, guardianName: body.guardianName || "Unknown", guardianPhone: body.phone || "" }).select().single();
      if (fErr) throw fErr;
      await supabase.from("members").insert({ familyId: family.id, fullName: body.childName || "", membershipTier: "member", policyStatus: "pending" });
      return res.status(200).json({ result: { data: { id: family.id, familyCode: code, token: code } } });
    } catch (err: any) { return res.status(500).json({ error: err.message }); }
  }

  // GET PARENT
  if (url.includes("/api/trpc/getParent")) {
    try {
      const inputParam = req.query?.input as string | undefined;
      let token = "";
      if (inputParam) { try { token = JSON.parse(inputParam)?.token || ""; } catch {} }
      const { data: families } = await supabase.from("families").select("*").eq("familyCode", token).limit(1);
      if (!families || families.length === 0) return res.status(404).json({ error: "Not found" });
      const family = families[0];
      const { data: members } = await supabase.from("members").select("*").eq("familyId", family.id).limit(1);
      const member = (members || [])[0] || {};
      return res.status(200).json({ result: { data: { ...family, childName: member.fullName || "", membershipTier: member.membershipTier || "member", policyStatus: member.policyStatus || "pending", memberId: member.id } } });
    } catch (err: any) { return res.status(500).json({ error: err.message }); }
  }

  // SUBMIT FORM
  if (url.includes("/api/trpc/submitForm")) {
    try {
      const body = req.body || {};
      const { data: families } = await supabase.from("families").select("id").eq("familyCode", body.token).limit(1);
      if (!families || families.length === 0) return res.status(404).json({ error: "Family not found" });
      const familyId = families[0].id;
      await supabase.from("families").update({ guardianName: body.guardianName, guardianPhone: body.guardianPhone, guardianEmail: body.guardianEmail }).eq("id", familyId);
      await supabase.from("members").update({ fullName: body.childName, membershipTier: body.membershipTier || "member", policyStatus: body.policyAccepted ? "accepted" : "pending" }).eq("familyId", familyId);
      return res.status(200).json({ result: { data: { success: true } } });
    } catch (err: any) { return res.status(500).json({ error: err.message }); }
  }

  return res.status(404).json({ error: "Unknown endpoint", url });
}
