import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  CalendarDays,
  Download,
  Filter,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

const tierLabel = (tier: "member" | "loyalty_member") =>
  tier === "loyalty_member" ? "Loyalty Member" : "Member";

function csvCell(value: unknown) {
  const text =
    value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function Reports() {
  const [registrationFrom, setRegistrationFrom] = useState("");
  const [registrationTo, setRegistrationTo] = useState("");
  const [membershipTier, setMembershipTier] = useState<
    "" | "member" | "loyalty_member"
  >("");
  const [branch, setBranch] = useState("");
  const filters = useMemo(
    () => ({
      registrationFrom: registrationFrom || undefined,
      registrationTo: registrationTo || undefined,
      membershipTier: membershipTier || undefined,
      branch: branch || undefined,
    }),
    [registrationFrom, registrationTo, membershipTier, branch]
  );
  const { data: report, isLoading } =
    trpc.reports.memberReport.useQuery(filters);
  const { data: branches = [] } = trpc.reports.branches.useQuery();

  const exportCsv = () => {
    if (!report?.records.length) return;
    const header = [
      "Member ID",
      "Student name",
      "Parent / Guardian",
      "Email",
      "Phone",
      "Registration date",
      "Membership",
      "Branch",
    ];
    const lines = report.records.map(row => [
      row.memberCode,
      row.studentName,
      row.parentName,
      row.parentEmail,
      row.parentPhone,
      row.registrationDate,
      tierLabel(row.membershipTier),
      row.branch,
    ]);
    const blob = new Blob(
      [[header, ...lines].map(row => row.map(csvCell).join(",")).join("\n")],
      { type: "text/csv;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `premier-ballet-member-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="rounded-[2rem] bg-[#302126] p-7 text-[#fffaf7] md:p-9">
        <p className="eyebrow text-[#d6a792]">Member intelligence</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="font-serif text-4xl">Reports</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#eaded9]">
              Review registrations by date, membership choice, and Academy
              branch. Download only the records currently visible in this
              report.
            </p>
          </div>
          <Sparkles className="h-10 w-10 text-[#d6a792]" />
        </div>
      </section>
      <section className="soft-card rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Filters</p>
            <h2 className="section-title mt-1">Refine member records</h2>
          </div>
          <Button
            onClick={exportCsv}
            disabled={!report?.records.length}
            className="rounded-xl bg-[#7c3f52] hover:bg-[#693344]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label htmlFor="report-from">Registration date from</Label>
            <Input
              id="report-from"
              type="date"
              value={registrationFrom}
              onChange={event => setRegistrationFrom(event.target.value)}
              className="mt-2 h-11 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="report-to">Registration date to</Label>
            <Input
              id="report-to"
              type="date"
              value={registrationTo}
              onChange={event => setRegistrationTo(event.target.value)}
              className="mt-2 h-11 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="report-tier">Membership type</Label>
            <select
              id="report-tier"
              value={membershipTier}
              onChange={event =>
                setMembershipTier(
                  event.target.value as "" | "member" | "loyalty_member"
                )
              }
              className="mt-2 h-11 w-full rounded-xl border border-[#eaded9] bg-white px-3 text-sm"
            >
              <option value="">All memberships</option>
              <option value="member">Member</option>
              <option value="loyalty_member">Loyalty Member</option>
            </select>
          </div>
          <div>
            <Label htmlFor="report-branch">Branch</Label>
            <select
              id="report-branch"
              value={branch}
              onChange={event => setBranch(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-[#eaded9] bg-white px-3 text-sm"
            >
              <option value="">All branches</option>
              {branches.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Metric
          icon={<Users />}
          label="Filtered members"
          value={report?.totalMembers ?? 0}
          tone="pink"
        />
        <Metric
          icon={<Sparkles />}
          label="Loyalty Members"
          value={report?.loyaltyMembers ?? 0}
          tone="gold"
        />
        <Metric
          icon={<MapPin />}
          label="Branches in result"
          value={report?.branchSummary.length ?? 0}
          tone="green"
        />
      </section>
      <section className="grid gap-7 xl:grid-cols-[1fr_2.2fr]">
        <div className="soft-card rounded-3xl p-6">
          <p className="eyebrow">By branch</p>
          <h2 className="section-title mt-1">Branch totals</h2>
          <div className="mt-5 space-y-3">
            {(report?.branchSummary ?? []).map(item => (
              <div
                key={item.branch}
                className="flex items-center justify-between rounded-2xl bg-[#fbf7f3] px-4 py-3"
              >
                <span className="text-sm text-[#49353c]">{item.branch}</span>
                <span className="rounded-full bg-[#f2ddd5] px-2.5 py-1 text-xs font-semibold text-[#7c3f52]">
                  {item.count}
                </span>
              </div>
            ))}
            {!report?.branchSummary.length && !isLoading ? (
              <p className="text-sm text-[#8d7b80]">No matching members yet.</p>
            ) : null}
          </div>
        </div>
        <div className="soft-card overflow-hidden rounded-3xl">
          <div className="flex items-center gap-2 border-b border-[#eaded9] px-6 py-5">
            <Filter className="h-4 w-4 text-[#7c3f52]" />
            <div>
              <p className="eyebrow">Member records</p>
              <h2 className="section-title mt-1">Filtered registration list</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-[#fbf7f3] text-xs uppercase tracking-[.1em] text-[#8d7078]">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Registration</th>
                  <th className="px-5 py-4">Membership</th>
                  <th className="px-5 py-4">Branch</th>
                  <th className="px-5 py-4">Parent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1e7e3]">
                {isLoading ? (
                  <tr>
                    <td className="px-5 py-8 text-[#8d7b80]" colSpan={5}>
                      Loading report…
                    </td>
                  </tr>
                ) : (
                  report?.records.map(record => (
                    <tr key={record.memberId}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#34262c]">
                          {record.studentName}
                        </p>
                        <p className="mt-1 text-xs text-[#8d7b80]">
                          {record.memberCode}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-[#5d474f]">
                        {record.registrationDate
                          ? new Date(
                              record.registrationDate
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            record.membershipTier === "loyalty_member"
                              ? "rounded-full bg-[#f4e5bb] px-2.5 py-1 text-xs font-semibold text-[#6f5420]"
                              : "rounded-full bg-[#f5e5dc] px-2.5 py-1 text-xs font-semibold text-[#7c3f52]"
                          }
                        >
                          {tierLabel(record.membershipTier)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#5d474f]">
                        {record.branch}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[#49353c]">
                          {record.parentName || "—"}
                        </p>
                        <p className="mt-1 text-xs text-[#8d7b80]">
                          {record.parentPhone || record.parentEmail || "—"}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "pink" | "gold" | "green";
}) {
  const colors = {
    pink: "bg-[#f5e5dc] text-[#7c3f52]",
    gold: "bg-[#f4e5bb] text-[#6f5420]",
    green: "bg-[#e5f0e8] text-[#477452]",
  };
  return (
    <div className="soft-card rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#76666b]">{label}</p>
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl ${colors[tone]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-5 font-serif text-4xl text-[#302126]">{value}</p>
    </div>
  );
}
