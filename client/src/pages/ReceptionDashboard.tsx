import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const SUPABASE_URL = "https://gpdxzjnjfqfchkpqptyu.supabase.co";
const SUPABASE_KEY = "sb_publishable_HMHsWkaV0Y0UtKHDE6T5tw_ahmNsXkM";

function normalizePhone(phone: string) {
  let d = (phone || "").replace(/\D/g, "");
  if (d.startsWith("200")) d = "20" + d.substring(3);
  else if (d.startsWith("0")) d = "20" + d.substring(1);
  else if (!d.startsWith("20")) d = "20" + d;
  return d;
}

export default function ReceptionDashboard() {
  const [search, setSearch] = useState("");
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParent, setNewParent] = useState({ guardianName: "", childName: "", phone: "" });
  const [adding, setAdding] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
      const [fRes, mRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/families?select=id,familyCode,guardianName,guardianPhone,guardianEmail&order=id.asc&limit=500`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/members?select=familyId,fullName,membershipTier,policyStatus&limit=500`, { headers }),
      ]);
      const [families, members] = await Promise.all([fRes.json(), mRes.json()]);
      const memberMap = new Map((members as any[]).map((m: any) => [m.familyId, m]));
      const records = (families as any[]).map((f: any) => {
        const m: any = memberMap.get(f.id) || {};
        return {
          id: f.id, familyCode: f.familyCode,
          guardianName: f.guardianName, phone: f.guardianPhone,
          email: f.guardianEmail, childName: m.fullName || "",
          membershipTier: m.membershipTier || "member",
          policy: m.policyStatus || "pending",
          token: f.familyCode,
        };
      });
      setParents(records);
    } catch (e: any) {
      setError("Could not load data: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSendWhatsApp = (parent: any) => {
    const phone = normalizePhone(parent.phone);
    const formLink = `${window.location.origin}/parent-form?token=${parent.token}`;
    const msg = `Hi there,\n\nPremier Ballet Academy asks you to review and update the information we have for ${parent.childName}, read the School Policy, and confirm it before submitting.\n\nPlease open your private form here:\n${formLink}\n\nThank you,\nPremier Ballet Academy`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleAddParent = async () => {
    if (!newParent.childName.trim()) return alert("Please enter child name");
    setAdding(true);
    try {
      const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const fRes = await fetch(`${SUPABASE_URL}/rest/v1/families`, {
        method: "POST", headers,
        body: JSON.stringify({ familyCode: code, guardianName: newParent.guardianName || "Unknown", guardianPhone: newParent.phone || "" }),
      });
      const family = (await fRes.json())[0];
      await fetch(`${SUPABASE_URL}/rest/v1/members`, {
        method: "POST", headers,
        body: JSON.stringify({ familyId: family.id, fullName: newParent.childName, membershipTier: "member", policyStatus: "pending" }),
      });
      setShowAddForm(false);
      setNewParent({ guardianName: "", childName: "", phone: "" });
      await loadData();
    } catch (e: any) {
      alert("Error adding parent: " + e.message);
    } finally {
      setAdding(false);
    }
  };

  const filtered = parents.filter((p) => {
    const q = search.toLowerCase();
    return !q || [p.childName, p.guardianName, p.phone, p.familyCode, p.policy].some((v) => String(v || "").toLowerCase().includes(q));
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reception Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{parents.length} families loaded</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>Refresh</Button>
          <Button onClick={() => setShowAddForm(true)}>+ Add New Parent</Button>
        </div>
      </div>

      {showAddForm && (
        <div className="border rounded-lg p-6 bg-gray-50 space-y-4">
          <h2 className="text-lg font-semibold">Add New Parent</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input placeholder="Child Name *" value={newParent.childName} onChange={(e) => setNewParent({ ...newParent, childName: e.target.value })} />
            <Input placeholder="Guardian Name" value={newParent.guardianName} onChange={(e) => setNewParent({ ...newParent, guardianName: e.target.value })} />
            <Input placeholder="Phone (e.g. 01012345678)" value={newParent.phone} onChange={(e) => setNewParent({ ...newParent, phone: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddParent} disabled={adding}>{adding ? "Adding..." : "Add Parent"}</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <Input placeholder="Search by name, phone, family code..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
        {search && <span className="text-sm text-gray-500">{filtered.length} results</span>}
      </div>

      {error && <div className="text-red-600 bg-red-50 p-4 rounded">{error}</div>}

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Child Name</TableHead>
              <TableHead>Guardian</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Policy</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /><p className="mt-2 text-gray-500">Loading families...</p></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No families found.</TableCell></TableRow>
            ) : filtered.map((parent) => (
              <TableRow key={parent.id}>
                <TableCell className="font-medium">{parent.childName || "-"}</TableCell>
                <TableCell>{parent.guardianName || "Unknown"}</TableCell>
                <TableCell>{parent.phone || "-"}</TableCell>
                <TableCell>
                  <Badge variant={parent.policy === "accepted" ? "default" : "destructive"}>
                    {parent.policy === "accepted" ? "Confirmed" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={parent.membershipTier === "loyalty_member" ? "bg-amber-100 text-amber-800" : ""}>
                    {parent.membershipTier === "loyalty_member" ? "Loyalty" : "Member"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleSendWhatsApp(parent)}>
                    Send WhatsApp
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
