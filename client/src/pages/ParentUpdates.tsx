import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { compactParentUpdatePath, guardianFirstName } from "@/lib/parentLinks";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  Copy,
  Link2,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const WhatsAppNumber = "201000305053";
type ParentUpdateStatus = {
  memberId: number;
  status: "pending" | "confirmed" | "expired" | "revoked";
  token: string;
  issuedAt: Date;
  submittedAt: Date | null;
};

export default function ParentUpdates() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [issued, setIssued] = useState<
    Array<{ memberId: number; token: string }>
  >([]);
  const utils = trpc.useUtils();
  const { data: members, isLoading } = trpc.member.list.useQuery({ search });
  const { data: statuses } = trpc.parentUpdate.statuses.useQuery();
  const statusByMember = useMemo(() => {
    const map = new Map<number, ParentUpdateStatus>();
    (statuses ?? []).forEach(status => {
      if (!map.has(status.memberId))
        map.set(status.memberId, status as ParentUpdateStatus);
    });
    return map;
  }, [statuses]);
  const issue = trpc.parentUpdate.issueLinks.useMutation({
    onSuccess: result => {
      setIssued(result.issued);
      utils.parentUpdate.statuses.invalidate();
      toast.success(
        `${result.issued.length} secure parent update link(s) prepared.`
      );
    },
  });
  const toggle = (memberId: number) =>
    setSelected(current => {
      const next = new Set(current);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  const linkFor = (token: string) =>
    `${window.location.origin}${compactParentUpdatePath(token)}`;
  const activeToken = (memberId: number) =>
    issued.find(item => item.memberId === memberId)?.token ??
    statusByMember.get(memberId)?.token;
  const copy = async (token?: string) => {
    if (!token) return;
    await navigator.clipboard.writeText(linkFor(token));
    toast.success("Secure parent update link copied.");
  };
  const whatsapp = (
    member: NonNullable<typeof members>[number],
    token?: string
  ) => {
    if (!token) return;
    const message = `Hello ${guardianFirstName(member.guardianName)},\n\nPremier Ballet Academy asks you to review and update your child's profile, choose Member or Loyalty Member, and accept the School Policy.\n\nPlease complete your secure update here:\n${linkFor(token)}\n\nThank you,\nPremier Ballet Academy`;
    const phone = (member.guardianPhone || WhatsAppNumber).replace(/\D/g, "");
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };
  return (
    <div className="mx-auto max-w-7xl space-y-6 fade-up">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Parent confirmation</p>
          <h1 className="section-title mt-1">Parent Updates & Policy Status</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#7b666c]">
            Issue a personal secure link for each existing parent. The status
            remains <b className="text-[#a33d46]">Pending</b> until profile
            details are updated and the policy is accepted.
          </p>
        </div>
        <Button
          onClick={() => issue.mutate({ memberIds: Array.from(selected) })}
          disabled={!selected.size || issue.isPending}
          className="h-11 rounded-xl bg-[#7c3f52] hover:bg-[#693344]"
        >
          <Send className="mr-2 h-4 w-4" />
          {issue.isPending
            ? "Preparing…"
            : `Prepare ${selected.size || ""} link${selected.size === 1 ? "" : "s"}`}
        </Button>
      </section>
      <section className="grid gap-4 rounded-2xl border border-[#ecd8d1] bg-[#fffaf8] p-5 md:grid-cols-[1fr_auto]">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#875064]" />
          <p className="text-sm leading-6 text-[#725e66]">
            A link is bound to the existing Member ID and a secure one-time
            token. On submission, the same record is updated and the policy
            acceptance timestamp is stored; no new member is created.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            setSelected(new Set((members ?? []).map(item => item.id)))
          }
          className="rounded-xl border-[#ddc0b6] text-[#7c3f52]"
        >
          Select visible parents
        </Button>
      </section>
      <section className="soft-card rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-[#a98e95]" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search by child, parent, phone, email, or Member ID…"
            className="h-11 rounded-xl border-[#eaded9] bg-[#fffdfa] pl-10"
          />
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-[#eaded9] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-[#fcf7f4] text-xs text-[#7f686f]">
              <tr>
                <th className="w-12 px-5 py-4"></th>
                <th className="px-5 py-4">Child / Member ID</th>
                <th className="px-5 py-4">Parent contact</th>
                <th className="px-5 py-4">Policy & update status</th>
                <th className="px-5 py-4">Secure link</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e7e3]">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-[#9a858a]"
                  >
                    Loading parents…
                  </td>
                </tr>
              ) : (
                members?.map(member => {
                  const status = statusByMember.get(member.id);
                  const token = activeToken(member.id);
                  const confirmed = status?.status === "confirmed";
                  return (
                    <tr
                      key={member.id}
                      className="transition hover:bg-[#fffaf7]"
                    >
                      <td className="px-5 py-4">
                        <Checkbox
                          checked={selected.has(member.id)}
                          onCheckedChange={() => toggle(member.id)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#38282e]">
                          {member.fullName}
                        </p>
                        <p className="mt-1 text-xs tracking-wide text-[#a68e95]">
                          {member.memberCode}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-[#5f4b52]">
                          {member.guardianName || "Parent name missing"}
                        </p>
                        <p className="mt-1 text-xs text-[#a68e95]">
                          {member.guardianPhone ||
                            member.guardianEmail ||
                            "No contact"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {confirmed ? (
                          <Badge className="gap-1 bg-[#e5f1e8] text-[#427255]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Confirmed
                          </Badge>
                        ) : status?.status === "pending" ? (
                          <Badge className="bg-[#fff0f0] text-[#a33d46]">
                            Pending
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-[#e7d6d1] text-[#9a7f87]"
                          >
                            Not sent
                          </Badge>
                        )}{" "}
                        {status?.submittedAt ? (
                          <p className="mt-1 text-[11px] text-[#8c777d]">
                            {new Date(status.submittedAt).toLocaleDateString(
                              "en-GB"
                            )}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        {token ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-[#e5d4ce] text-[#7c3f52]"
                            onClick={() => copy(token)}
                          >
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copy link
                          </Button>
                        ) : (
                          <span className="text-xs text-[#a68e95]">
                            Select and prepare
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {token && !confirmed ? (
                          <Button
                            size="sm"
                            className="rounded-lg bg-[#276b49] hover:bg-[#205b3e]"
                            onClick={() => whatsapp(member, token)}
                          >
                            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                            WhatsApp
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      {issued.length ? (
        <section className="rounded-2xl border border-[#d8e5d9] bg-[#f6fbf6] p-5">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[#50775d]" />
            <h2 className="font-serif text-xl text-[#30563c]">
              Links ready to send
            </h2>
          </div>
          <p className="mt-1 text-sm text-[#5d7664]">
            Use the WhatsApp button beside each parent to open a message with
            the correct private link.
          </p>
        </section>
      ) : null}
    </div>
  );
}
