import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://gpdxzjnjfqfchkpqptyu.supabase.co";
const SUPABASE_KEY = "sb_publishable_HMHsWkaV0Y0UtKHDE6T5tw_ahmNsXkM";
const h = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };

const SCHOOL_POLICY = [
  { title: "1. We Are a School", text: "Premier Ballet Academy is not a club or recreational center—we are an academic ballet school. This distinction is important, as our commitment is to provide structured, progressive, and disciplined training aligned with professional ballet education standards." },
  { title: "2. Season Duration", text: "Our academic season runs for 11 months from September through July. This full academic year allows students to progress consistently and be well-prepared for assessments, performances, and advancement.\n\nPlease note that national holidays, the winter break (30.12-3.1), and spring break (Coptic Easter/Sham En Nesim holiday) do not reduce or alter the monthly tuition fee." },
  { title: "3. Fees and Payment Policy", text: "Equal monthly fee for each of the 11 months of the academic year.\nFees are expected to be paid on time each month, regardless of attendance.\nAs an academic institution, your place in class is reserved and the tuition secures your spot and supports the ongoing operation of the Academy.\nMissed classes, for any reason (except serious illness, proven on paper) do not result in fee reductions or credits.\nEach student is entitled to two make up session per month according to existing schedule.\n\nPayment Window:\nPayments should be made between the 25th of the current month and the 10th of the following month. Penalties of 300le will be applied afterwards. Request for exception of the payment deadline will only be considered if they are submitted in advance for following payment and approved by the academy's management. Requests made after payment deadline will not be accepted.\n\nLoyalty Program Option (optional):\nAnnual loyalty card fee 2500egp (non-refundable under any circumstances). Membership provides a discounted price list on tuition fees, and 10% discount on performances and workshops.\nFamilies who choose not to take the loyalty card will follow a different standard price list and will not be eligible for discounts.\nLoyalty program can be joined at any time during the year, and once enrolled, all applicable discounts will be activated from that point onward.\nOnce purchased, loyalty card is valid until the end of the 2026/2027 academic year (end of July 2027), regardless of when during the year it was activated.\n\nAccepted Payment Methods: Cash, Visa, Instapay" },
  { title: "4. Uniform Requirement", text: "To promote discipline, unity, and professionalism, our uniform is mandatory for all students during class. The proper uniform must be worn at all times in accordance with each level's requirements.\n\nFor classical ballet classes, the official academy uniform is strictly required, and hair must be neatly styled in a classical ballet bun at all times." },
  { title: "5. Photography & Social Media", text: "Premier Ballet Academy records classes and performances for training and promotional purposes, and content may be shared on social media.\n\nIf you prefer that your child does not appear in any media, please type 'Opt me out from media' in the box below. While we make every effort to respect your preferences, should your child accidentally appear in any content, we guarantee its immediate removal upon request." }
];

async function requireSuccessfulResponse(response: Response, fallback: string) {
  if (response.ok) return;

  let message = fallback;
  try {
    const body = await response.json();
    if (typeof body?.error === "string") message = body.error;
    if (typeof body?.message === "string") message = body.message;
  } catch {
    // Keep the fallback when the response is not JSON.
  }
  throw new Error(message);
}

export default function ParentForm() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [familyId, setFamilyId] = useState<number | null>(null);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);

  const [formData, setFormData] = useState({
    childName: "", birthDate: "", guardianName: "", guardianEmail: "",
    phone: "", medicalCond: "", previousExperience: "", mediaOptOut: "",
    isLoyaltyMember: false, policyConfirmed: false,
  });

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    (async () => {
      try {
        const fRes = await fetch(`${SUPABASE_URL}/rest/v1/families?familyCode=eq.${token}&select=*&limit=1`, { headers: h });
        const families = await fRes.json();
        if (!families?.length) { setLoading(false); return; }
        const family = families[0];
        setFamilyId(family.id);
        const mRes = await fetch(`${SUPABASE_URL}/rest/v1/members?familyId=eq.${family.id}&select=*&limit=1`, { headers: h });
        const members = await mRes.json();
        const member = (members || [])[0] || {};
        setMemberId(member.id || null);
        setFormData({
          childName: member.fullName || "", birthDate: member.birthDate || "",
          guardianName: family.guardianName || "", guardianEmail: family.guardianEmail || "",
          phone: family.guardianPhone || "", medicalCond: member.medicalCondition || "",
          previousExperience: member.previousExperience || "", mediaOptOut: family.notes || "",
          isLoyaltyMember: member.membershipTier === "loyalty_member",
          policyConfirmed: member.policyStatus === "accepted",
        });
      } catch { toast.error("Failed to load form."); }
      finally { setLoading(false); }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.policyConfirmed) { toast.error("Please open and confirm the School Policy at the bottom."); return; }
    if (!familyId) { toast.error("Invalid form link."); return; }
    if (!memberId) { toast.error("No student record was found for this form."); return; }
    setSubmitting(true);
    try {
      const familyResponse = await fetch(`${SUPABASE_URL}/rest/v1/families?id=eq.${familyId}`, {
        method: "PATCH", headers: h,
        body: JSON.stringify({ guardianName: formData.guardianName, guardianPhone: formData.phone, guardianEmail: formData.guardianEmail, notes: formData.mediaOptOut }),
      });
      await requireSuccessfulResponse(familyResponse, "Could not save the parent information.");
      const memberResponse = await fetch(`${SUPABASE_URL}/rest/v1/members?id=eq.${memberId}`, {
        method: "PATCH", headers: h,
        body: JSON.stringify({
          fullName: formData.childName, birthDate: formData.birthDate || null,
          membershipTier: formData.isLoyaltyMember ? "loyalty_member" : "member",
          policyStatus: "accepted", medicalCondition: formData.medicalCond || "no",
        }),
      });
      await requireSuccessfulResponse(memberResponse, "Could not save the student information.");

      // Wait for the server to accept the email before showing confirmation.
      const emailResponse = await fetch("/api/send-card", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: formData.childName,
          guardianName: formData.guardianName,
          memberId: `M-${token}`,
          tier: formData.isLoyaltyMember ? "loyalty_member" : "member",
          guardianEmail: formData.guardianEmail
        })
      });
      await requireSuccessfulResponse(
        emailResponse,
        "Your information was saved, but the virtual card email could not be sent. Please try submitting again."
      );
      
      setSubmitted(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit. Please try again.");
    }
    finally { setSubmitting(false); }
  };

  if (!token) return <div className="p-8 text-center text-red-500 font-bold">Invalid link. No token provided.</div>;
  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-md w-full mx-auto text-center space-y-4 bg-white p-8 rounded-xl shadow-lg border-t-8 border-green-500">
        <div className="text-6xl">✅</div>
        <h2 className="text-3xl font-bold text-gray-900">Thank You!</h2>
        <p className="text-lg text-gray-600">Your information has been submitted successfully.</p>
        <p className="text-sm text-gray-500">Your virtual card has been sent to {formData.guardianEmail}.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg w-full mx-auto space-y-6 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-900">Premier Ballet Academy</h2>
          <p className="mt-1 text-sm text-gray-500">Parent Registration & Profile Update</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div><Label>Child Full Name *</Label><Input value={formData.childName} onChange={e => setFormData({...formData, childName: e.target.value})} required /></div>
          <div><Label>Date of Birth</Label><Input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} /></div>
          <div><Label>Parent / Guardian Name *</Label><Input value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} required /></div>
          <div><Label>Email Address *</Label><Input type="email" value={formData.guardianEmail} onChange={e => setFormData({...formData, guardianEmail: e.target.value})} required /></div>
          <div><Label>Phone Number (WhatsApp) *</Label><Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required /></div>
          <div><Label>Medical Conditions (if any)</Label><Input value={formData.medicalCond} onChange={e => setFormData({...formData, medicalCond: e.target.value})} placeholder="None" /></div>

          <div className="flex items-center space-x-2 pt-2 border-t">
            <Checkbox id="loyalty" checked={formData.isLoyaltyMember} onCheckedChange={c => setFormData({...formData, isLoyaltyMember: !!c})} />
            <Label htmlFor="loyalty" className="font-semibold text-amber-600 cursor-pointer">Upgrade to Loyalty Member (Optional)</Label>
          </div>

          {/* SCHOOL POLICY */}
          <div className="border rounded-lg overflow-hidden border-amber-300 shadow-sm">
            <button type="button" onClick={() => setPolicyOpen(!policyOpen)}
              className="w-full flex justify-between items-center p-4 bg-amber-50 hover:bg-amber-100 text-left font-semibold text-gray-900 transition-colors">
              <span>📋 Click Here to Read & Confirm School Policy *</span>
              <span className="text-amber-700">{policyOpen ? "▲" : "▼"}</span>
            </button>
            
            {policyOpen && (
              <div className="p-5 space-y-5 max-h-96 overflow-y-auto bg-white border-t text-sm">
                <p className="font-semibold text-center pb-2 border-b">Premier Ballet Academy - School Policies and Guidelines</p>
                {SCHOOL_POLICY.map((item, i) => (
                  <div key={i}>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-gray-700 mt-1 whitespace-pre-line leading-relaxed">{item.text}</p>
                  </div>
                ))}
                
                <div className="pt-2">
                  <Label className="text-gray-900 font-semibold mb-1 block">Media Opt-Out (Optional)</Label>
                  <Input 
                    value={formData.mediaOptOut} 
                    onChange={e => setFormData({...formData, mediaOptOut: e.target.value})} 
                    placeholder="Type 'Opt me out from media' here if desired..."
                    className="mt-1"
                  />
                </div>

                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-start space-x-3">
                    <Checkbox id="policy" checked={formData.policyConfirmed} onCheckedChange={c => setFormData({...formData, policyConfirmed: !!c})} />
                    <Label htmlFor="policy" className="cursor-pointer text-sm leading-relaxed text-green-900 font-medium pt-0.5">
                      I have read and agree to all points of the Premier Ballet Academy School Policy.
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full h-12 text-base font-bold" disabled={submitting || !formData.policyConfirmed}>
            {submitting ? <><Loader2 className="animate-spin h-5 w-5 mr-2" />Submitting...</> : "✅ Submit & Confirm"}
          </Button>
        </form>
      </div>
    </div>
  );
}
