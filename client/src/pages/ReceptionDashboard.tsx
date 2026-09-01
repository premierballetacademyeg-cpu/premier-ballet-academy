import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, FileDown, Edit2, X, Check, Bell } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://gpdxzjnjfqfchkpqptyu.supabase.co";
const SUPABASE_KEY = "sb_publishable_HMHsWkaV0Y0UtKHDE6T5tw_ahmNsXkM";
const h = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };

function normalizePhone(phone: string) {
  let d = (phone || "").replace(/\D/g, "");
  if (d.startsWith("200")) d = "20" + d.substring(3);
  else if (d.startsWith("0")) d = "20" + d.substring(1);
  else if (!d.startsWith("20")) d = "20" + d;
  return d;
}

type Parent = {
  id: number; familyCode: string; guardianName: string; phone: string;
  email: string; childName: string; membershipTier: string; policy: string;
  token: string; memberId: number | null; sent?: boolean; updatedAt: string;
  cardEmailStatus?: string; cardEmailSentAt?: string;
};

const SENT_KEY = "pba_whatsapp_sent";
function getSentSet(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SENT_KEY) || "[]")); } catch { return new Set(); }
}
function markSent(familyCode: string) {
  const s = getSentSet(); s.add(familyCode);
  localStorage.setItem(SENT_KEY, JSON.stringify([...s]));
}

function getCardEmailBadgeColor(status?: string) {
  switch (status) {
    case "sent":
      return "bg-green-100 text-green-800 border-green-300";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "failed":
      return "bg-red-100 text-red-800 border-red-300";
    case "bounced":
      return "bg-orange-100 text-orange-800 border-orange-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

function formatCardEmailStatus(status?: string, sentAt?: string) {
  if (!status) return "—";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  if (status === "sent" && sentAt) {
    return `${label} • ${new Date(sentAt).toLocaleDateString()}`;
  }
  return label;
}

export default function ReceptionDashboard() {
  const [search, setSearch] = useState("");
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newP, setNewP] = useState({ guardianName: "", childName: "", phone: "" });
  const [editParent, setEditParent] = useState<Parent | null>(null);
  const [editData, setEditData] = useState<Partial<Parent>>({});
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const sentSet = getSentSet();
      // Use limit 3000 and order by createdAt descending to ensure we get newest additions like Andy More
      const [fRes, mRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/families?select=id,familyCode,guardianName,guardianPhone,guardianEmail,updatedAt&order=createdAt.desc&limit=3000`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/members?select=id,familyId,fullName,membershipTier,policyStatus,updatedAt&limit=3000`, { headers: h }),
      ]);
      const [families, members] = await Promise.all([fRes.json(), mRes.json()]);
      const memberMap = new Map((members as any[]).map((m: any) => [m.familyId, m]));
      
      // Fetch card email delivery status from your backend
      const cardEmailMap = new Map();
      try {
        const cardEmailRes = await fetch("/api/card-email-status", { method: "GET" });
        if (cardEmailRes.ok) {
          const cardEmailData = await cardEmailRes.json();
          cardEmailData.forEach((delivery: any) => {
            cardEmailMap.set(delivery.memberId, {
              status: delivery.status,
              sentAt: delivery.sentAt,
            });
          });
        }
      } catch (err) {
        console.warn("Failed to fetch card email statuses:", err);
      }

      setParents((families as any[]).map((f: any) => {
        const m: any = memberMap.get(f.id) || {};
        const cardEmail = cardEmailMap.get(m.id);
        return {
          id: f.id, familyCode: f.familyCode, guardianName: f.guardianName || "Unknown",
          phone: f.guardianPhone || "", email: f.guardianEmail || "",
          childName: m.fullName || "", membershipTier: m.membershipTier || "member",
          policy: m.policyStatus || "pending", token: f.familyCode,
          memberId: m.id || null, sent: sentSet.has(f.familyCode),
          updatedAt: m.updatedAt > f.updatedAt ? m.updatedAt : f.updatedAt,
          cardEmailStatus: cardEmail?.status,
          cardEmailSentAt: cardEmail?.sentAt,
        };
      }));
    } catch (e: any) { toast.error("Failed to load: " + e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSendWhatsApp = (parent: Parent) => {
    const phone = normalizePhone(parent.phone);
    const formLink = `${window.location.origin}/parent-form?token=${parent.token}`;
    const msg = `Hi there,\n\nPremier Ballet Academy asks you to review and update the information we have for ${parent.childName || "your child"}, read the School Policy, and confirm it before su[...]
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    markSent(parent.familyCode);
    setParents(prev => prev.map(p => p.familyCode === parent.familyCode ? { ...p, sent: true } : p));
  };

  const handleAddParent = async () => {
    if (!newP.childName.trim()) { toast.error("Child name is required"); return; }
    setAdding(true);
    try {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const normalized = (newP.childName || "").toLowerCase().replace(/\s+/g, " ").trim();
      const memberCode = "M-" + code;
      const fRes = await fetch(`${SUPABASE_URL}/rest/v1/families`, {
        method: "POST", headers: h,
        body: JSON.stringify({ familyCode: code, guardianName: newP.guardianName || "Unknown", guardianPhone: newP.phone || "" }),
      });
      if (!fRes.ok) { const e = await fRes.json(); throw new Error(JSON.stringify(e)); }
      const family = (await fRes.json())[0];
      await fetch(`${SUPABASE_URL}/rest/v1/members`, {
        method: "POST", headers: h,
        body: JSON.stringify({ familyId: family.id, memberCode, fullName: newP.childName.trim(), normalizedName: normalized, membershipTier: "member", policyStatus: "not_accepted", membershipStat[...]
      });
      toast.success(`✅ ${newP.childName} added! Family code: ${code}`);
      setShowAdd(false);
      setNewP({ guardianName: "", childName: "", phone: "" });
      await loadData();
    } catch (e: any) { toast.error("Failed to add: " + e.message); }
    finally { setAdding(false); }
  };

  const openEdit = (p: Parent) => { setEditParent(p); setEditData({ guardianName: p.guardianName, phone: p.phone, email: p.email, childName: p.childName, membershipTier: p.membershipTier }); };
  const saveEdit = async () => {
    if (!editParent) return;
    setSaving(true);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/families?id=eq.${editParent.id}`, {
        method: "PATCH", headers: h,
        body: JSON.stringify({ guardianName: editData.guardianName, guardianPhone: editData.phone, guardianEmail: editData.email }),
      });
      if (editParent.memberId) {
        await fetch(`${SUPABASE_URL}/rest/v1/members?id=eq.${editParent.memberId}`, {
          method: "PATCH", headers: h,
          body: JSON.stringify({ fullName: editData.childName, membershipTier: editData.membershipTier }),
        });
      }
      toast.success("Saved!");
      setEditParent(null);
      await loadData();
    } catch (e: any) { toast.error("Save failed: " + e.message); }
    finally { setSaving(false); }
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  };

  const exportPDF = async () => {
    // If no specific rows are checked, export ALL currently filtered rows
    const rowsToExport = selected.size > 0 ? filtered.filter(p => selected.has(p.id)) : filtered;
    if (rowsToExport.length === 0) { toast.error("No records found to export."); return; }
    
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Premier Ballet Academy — Parent Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}  |  ${rowsToExport.length} records`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [["#", "Family Code", "Child Name", "Guardian", "Phone", "Email", "Policy", "Tier", "WhatsApp Sent", "Card Email"]],
      body: rowsToExport.map((p, i) => [i + 1, p.familyCode, p.childName, p.guardianName, p.phone, p.email, p.policy === "accepted" ? "Confirmed" : "Pending", p.membershipTier === "loyalty_member" ? "⭐ Loyalty" : "Member", p.sent ? "✓ Sent" : "Not sent", formatCardEmailStatus(p.cardEmailStatus, p.cardEmailSentAt)]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [120, 50, 80] },
    });
    doc.save(`PBA-Report-${new Date().toISOString().slice(0,10)}.pdf`);
    toast.success(`Exported ${rowsToExport.length} records to PDF!`);
  };

  const filtered = parents.filter(p => {
    const q = search.toLowerCase();
    return !q || [p.childName, p.guardianName, p.phone, p.familyCode, p.policy, p.email].some(v => String(v || "").toLowerCase().includes(q));
  });

  // Check if a parent was updated in the last 24 hours and is accepted
  const isRecentlySubmitted = (parent: Parent) => {
    if (parent.policy !== "accepted" || !parent.updatedAt) return false;
    const hours = (new Date().getTime() - new Date(parent.updatedAt).getTime()) / (1000 * 60 * 60);
    return hours < 24;
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Reception Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{parents.length} families · {selected.size > 0 && <span className="text-blue-600 font-medium">{selected.size} selected</span>}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" onClick={loadData} disabled={loading}>Refresh</Button>
          <Button variant="secondary" onClick={exportPDF} className="gap-1 bg-gray-100 hover:bg-gray-200">
            <FileDown className="h-4 w-4" />
            {selected.size > 0 ? `Export PDF (${selected.size})` : "Export Filtered to PDF"}
          </Button>
          <Button onClick={() => setShowAdd(true)}>+ Add New Parent</Button>
        </div>
      </div>

      {showAdd && (
        <div className="border rounded-lg p-5 bg-blue-50 space-y-4 shadow-sm">
          <h2 className="font-semibold text-lg">Add New Parent</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><Label>Child Name *</Label><Input placeholder="e.g. Sara Ahmed" value={newP.childName} onChange={e => setNewP({...newP, childName: e.target.value})} /></div>
            <div><Label>Guardian Name</Label><Input placeholder="e.g. Ahmed Hassan" value={newP.guardianName} onChange={e => setNewP({...newP, guardianName: e.target.value})} /></div>
            <div><Label>Phone</Label><Input placeholder="e.g. 01012345678" value={newP.phone} onChange={e => setNewP({...newP, phone: e.target.value})} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddParent} disabled={adding}>{adding ? <><Loader2 className="animate-spin h-4 w-4 mr-1"/>Adding...</> : "Add Parent"}</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border">
        <Input placeholder="Search name, phone, code, policy..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md bg-white" />
        <span className="text-sm font-medium text-gray-600">{filtered.length} results</span>
      </div>

      <div className="border rounded-md bg-white overflow-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
              <TableHead>Child Name</TableHead>
              <TableHead>Guardian</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Policy Status</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>WhatsApp Sent</TableHead>
              <TableHead>Card Email</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-12"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /><p className="mt-2 text-gray-500 font-medium">Loading[...]
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-12 text-gray-500">No families found.</TableCell></TableRow>
            ) : filtered.map(parent => (
              <TableRow key={parent.id} className={selected.has(parent.id) ? "bg-blue-50" : ""}>
                <TableCell><Checkbox checked={selected.has(parent.id)} onCheckedChange={() => toggleSelect(parent.id)} /></TableCell>
                <TableCell className="font-medium">
                  {parent.childName || "—"}
                  {isRecentlySubmitted(parent) && <span className="ml-2 inline-flex items-center text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wi[...]
                </TableCell>
                <TableCell className="text-gray-700">{parent.guardianName}</TableCell>
                <TableCell className="text-gray-600 text-sm">{parent.phone || "—"}</TableCell>
                <TableCell>
                  <Badge variant={parent.policy === "accepted" ? "default" : "destructive"} className={parent.policy === "accepted" ? "bg-green-600 hover:bg-green-700" : ""}>
                    {parent.policy === "accepted" ? "✓ Confirmed" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${parent.membershipTier === "loyalty_member" ? "bg-amber-100 text-amber-800 border-amber-300" : ""}`}>
                    {parent.membershipTier === "loyalty_member" ? "⭐ Loyalty" : "Member"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {parent.sent
                    ? <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded">✓ Sent</span>
                    : <span className="text-xs text-gray-400 font-medium">Not sent</span>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs font-medium ${getCardEmailBadgeColor(parent.cardEmailStatus)}`}>
                    {formatCardEmailStatus(parent.cardEmailStatus, parent.cardEmailSentAt)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant={parent.sent ? "secondary" : "default"} size="sm" className="text-xs h-8" onClick={() => handleSendWhatsApp(parent)}>
                      {parent.sent ? "Resend" : "WhatsApp"}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(parent)}>
                      <Edit2 className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* EDIT MODAL */}
      {editParent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button onClick={() => setEditParent(null)}><X className="h-6 w-6 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-4">
              <div><Label className="text-gray-700">Child Name</Label><Input value={editData.childName || ""} onChange={e => setEditData({...editData, childName: e.target.value})} className="mt-1[...]
              <div><Label className="text-gray-700">Guardian Name</Label><Input value={editData.guardianName || ""} onChange={e => setEditData({...editData, guardianName: e.target.value})} classN[...]
              <div><Label className="text-gray-700">Phone</Label><Input value={editData.phone || ""} onChange={e => setEditData({...editData, phone: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-gray-700">Email</Label><Input value={editData.email || ""} onChange={e => setEditData({...editData, email: e.target.value})} className="mt-1" /></div>
              <div>
                <Label className="text-gray-700">Membership Tier</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-white" value={editData.membershipTier} onChange={e => setEditData({...editData, membershipTier: e.target.valu[...]
                  <option value="member">Member</option>
                  <option value="loyalty_member">Loyalty Member</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={saveEdit} disabled={saving} className="flex-1 font-bold h-11">{saving ? <><Loader2 className="animate-spin h-5 w-5 mr-2"/>Saving...</> : <><Check className="h-5 w-5[...]
              <Button variant="outline" onClick={() => setEditParent(null)} className="h-11 px-6">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
