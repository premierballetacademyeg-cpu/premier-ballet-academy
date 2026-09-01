import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://gpdxzjnjfqfchkpqptyu.supabase.co";
const SUPABASE_KEY = "sb_publishable_HMHsWkaV0Y0UtKHDE6T5tw_ahmNsXkM";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

export default function ParentForm() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [familyId, setFamilyId] = useState<number | null>(null);
  const [memberId, setMemberId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    childName: "",
    birthDate: "",
    guardianName: "",
    guardianEmail: "",
    phone: "",
    medicalCond: "",
    previousExperience: "",
    isLoyaltyMember: false,
    policyConfirmed: false,
  });

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    (async () => {
      try {
        const fRes = await fetch(`${SUPABASE_URL}/rest/v1/families?familyCode=eq.${token}&select=*&limit=1`, { headers });
        const families = await fRes.json();
        if (!families || families.length === 0) { setLoading(false); return; }
        const family = families[0];
        setFamilyId(family.id);

        const mRes = await fetch(`${SUPABASE_URL}/rest/v1/members?familyId=eq.${family.id}&select=*&limit=1`, { headers });
        const members = await mRes.json();
        const member = (members || [])[0] || {};
        setMemberId(member.id || null);

        setFormData({
          childName: member.fullName || "",
          birthDate: member.birthDate || "",
          guardianName: family.guardianName || "",
          guardianEmail: family.guardianEmail || "",
          phone: family.guardianPhone || "",
          medicalCond: member.medicalCond || "",
          previousExperience: member.previousExperience || "",
          isLoyaltyMember: member.membershipTier === "loyalty_member",
          policyConfirmed: member.policyStatus === "accepted",
        });
      } catch (e) {
        toast.error("Failed to load form data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.policyConfirmed) { toast.error("Please confirm the school policy."); return; }
    if (!familyId) { toast.error("Invalid form link."); return; }
    setSubmitting(true);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/families?id=eq.${familyId}`, {
        method: "PATCH", headers,
        body: JSON.stringify({ guardianName: formData.guardianName, guardianPhone: formData.phone, guardianEmail: formData.guardianEmail }),
      });
      if (memberId) {
        await fetch(`${SUPABASE_URL}/rest/v1/members?id=eq.${memberId}`, {
          method: "PATCH", headers,
          body: JSON.stringify({
            fullName: formData.childName,
            birthDate: formData.birthDate || null,
            membershipTier: formData.isLoyaltyMember ? "loyalty_member" : "member",
            policyStatus: "accepted",
            medicalCond: formData.medicalCond,
            previousExperience: formData.previousExperience,
          }),
        });
      }
      setSubmitted(true);
    } catch (err: any) {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Premier Ballet Academy</h2>
          <p className="mt-2 text-sm text-gray-600">Please fill in your details and confirm the School Policy.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="childName">Child Full Name *</Label>
              <Input id="childName" value={formData.childName} onChange={e => setFormData({...formData, childName: e.target.value})} required />
            </div>
            <div>
              <Label htmlFor="birthDate">Date of Birth</Label>
              <Input type="date" id="birthDate" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="guardianName">Parent / Guardian Name *</Label>
              <Input id="guardianName" value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} required />
            </div>
            <div>
              <Label htmlFor="guardianEmail">Email Address *</Label>
              <Input type="email" id="guardianEmail" value={formData.guardianEmail} onChange={e => setFormData({...formData, guardianEmail: e.target.value})} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number (WhatsApp) *</Label>
              <Input type="tel" id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
            </div>
            <div>
              <Label htmlFor="medicalCond">Medical Conditions (if any)</Label>
              <Input id="medicalCond" value={formData.medicalCond} onChange={e => setFormData({...formData, medicalCond: e.target.value})} placeholder="None" />
            </div>
            <div>
              <Label htmlFor="previousExperience">Previous Ballet Experience</Label>
              <Input id="previousExperience" value={formData.previousExperience} onChange={e => setFormData({...formData, previousExperience: e.target.value})} placeholder="None" />
            </div>
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Checkbox id="loyalty" checked={formData.isLoyaltyMember} onCheckedChange={c => setFormData({...formData, isLoyaltyMember: !!c})} />
              <Label htmlFor="loyalty" className="font-semibold text-amber-600 cursor-pointer">Upgrade to Loyalty Member (Optional)</Label>
            </div>
            <div className="flex items-start space-x-2 pt-4 border-t bg-gray-50 p-4 rounded-lg">
              <Checkbox id="policy" checked={formData.policyConfirmed} onCheckedChange={c => setFormData({...formData, policyConfirmed: !!c})} />
              <Label htmlFor="policy" className="cursor-pointer text-sm leading-relaxed">
                <strong>I confirm that I have read and agree to the Premier Ballet Academy School Policy.</strong>
                <br /><span className="text-gray-500">By checking this box you acknowledge all academy rules and regulations.</span>
              </Label>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !formData.policyConfirmed}>
            {submitting ? <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Submitting...</> : "Submit & Confirm"}
          </Button>
        </form>
      </div>
    </div>
  );
}
