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
  { title: "1. Attendance & Punctuality", text: "Students must arrive 10 minutes before class. More than 3 unexcused absences per term may result in removal from the class roster. Please notify the academy in advance for any planned absence." },
  { title: "2. Dress Code", text: "All students must wear the required academy uniform for their level. Hair must be neatly secured in a bun. No jewellery is permitted during class for safety reasons." },
  { title: "3. Respect & Behaviour", text: "Students and parents must treat all staff, instructors, and fellow students with respect. Bullying, aggression, or disruptive behaviour will not be tolerated and may result in immediate dismissal." },
  { title: "4. Health & Medical Conditions", text: "Parents must inform the academy of any medical conditions, allergies, or injuries before classes begin. The academy must be notified immediately of any changes to a student's health." },
  { title: "5. Payment & Fees", text: "Tuition fees are due at the beginning of each term. Failure to pay may result in suspension of classes. Fees are non-refundable after the first week of term." },
  { title: "6. Photography & Social Media", text: "No photography or video recording is permitted inside studios during classes without explicit written consent from the academy. The academy may photograph or film students for promotional purposes only with prior parental consent." },
  { title: "7. Safety & Academy Premises", text: "Students must not be left unattended outside the academy. The academy is not responsible for students outside of scheduled class times. Parents must ensure timely pick-up after each class." },
  { title: "8. Communication", text: "All official communications from the academy will be sent via WhatsApp or email. Parents are responsible for keeping their contact information up to date through the parent portal." },
];

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
    phone: "", medicalCond: "", previousExperience: "",
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
          previousExperience: member.previousExperience || "",
          isLoyaltyMember: member.membershipTier === "loyalty_member",
          policyConfirmed: member.policyStatus === "accepted",
        });
      } catch { toast.error("Failed to load form."); }
      finally { setLoading(false); }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.policyConfirmed) { toast.error("Please read and confirm the School Policy."); return; }
    if (!familyId) { toast.error("Invalid form link."); return; }
    setSubmitting(true);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/families?id=eq.${familyId}`, {
        method: "PATCH", headers: h,
        body: JSON.stringify({ guardianName: formData.guardianName, guardianPhone: formData.phone, guardianEmail: formData.guardianEmail }),
      });
      if (memberId) {
        await fetch(`${SUPABASE_URL}/rest/v1/members?id=eq.${memberId}`, {
          method: "PATCH", headers: h,
          body: JSON.stringify({
            fullName: formData.childName, birthDate: formData.birthDate || null,
            membershipTier: formData.isLoyaltyMember ? "loyalty_member" : "member",
            policyStatus: "accepted", medicalCondition: formData.medicalCond || "no",
          }),
        });
      }
      setSubmitted(true);
    } catch { toast.error("Failed to submit. Please try again."); }
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
        <p className="text-sm text-gray-500">Premier Ballet Academy will contact you shortly.</p>
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
          <div className="border rounded-lg overflow-hidden">
            <button type="button" onClick={() => setPolicyOpen(!policyOpen)}
              className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 text-left font-semibold text-gray-800">
              <span>📋 School Policy — Read Before Confirming</span>
              <span className="text-gray-400">{policyOpen ? "▲" : "▼"}</span>
            </button>
            {policyOpen && (
              <div className="p-4 space-y-4 max-h-72 overflow-y-auto bg-white border-t text-sm">
                {SCHOOL_POLICY.map((item, i) => (
                  <div key={i}>
                    <p className="font-semibold text-gray-800">{item.title}</p>
                    <p className="text-gray-600 mt-1 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-start space-x-3 p-4 bg-amber-50 border-t">
              <Checkbox id="policy" checked={formData.policyConfirmed} onCheckedChange={c => setFormData({...formData, policyConfirmed: !!c})} />
              <Label htmlFor="policy" className="cursor-pointer text-sm leading-relaxed">
                <strong>I have read and agree to all points of the Premier Ballet Academy School Policy.</strong>
                <br /><span className="text-amber-700 text-xs">Click the section above to read the full policy before confirming.</span>
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base" disabled={submitting || !formData.policyConfirmed}>
            {submitting ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Submitting...</> : "✅ Submit & Confirm"}
          </Button>
        </form>
      </div>
    </div>
  );
}
