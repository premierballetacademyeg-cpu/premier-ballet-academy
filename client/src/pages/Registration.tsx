import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { compactRegistrationPath } from "@/lib/parentLinks";
import { ACADEMY_BRANCHES } from "@shared/const";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Mode = "new" | "existing";
type AcademyBranch = (typeof ACADEMY_BRANCHES)[number];
type FormState = {
  fullName: string;
  birthDateRaw: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  branch: AcademyBranch | "";
  membershipStatus: "eligible" | "not_enrolled" | "inactive";
  classGroupIds: number[];
};
const defaultForm: FormState = {
  fullName: "",
  birthDateRaw: "",
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
  branch: "",
  membershipStatus: "not_enrolled",
  classGroupIds: [],
};

export default function Registration() {
  const [mode, setMode] = useState<Mode>("new");
  const [form, setForm] = useState<FormState>(defaultForm);
  const [memberSearch, setMemberSearch] = useState("");
  const [existingId, setExistingId] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const { data: classes = [] } = trpc.classes.list.useQuery();
  const { data: matchedMembers = [] } = trpc.member.list.useQuery({
    search: memberSearch,
  });
  const duplicate = trpc.registration.checkDuplicates.useQuery(
    {
      fullName: form.fullName || "-",
      guardianPhone: form.guardianPhone || undefined,
      guardianEmail: form.guardianEmail || undefined,
    },
    { enabled: false }
  );
  const utils = trpc.useUtils();
  const create = trpc.registration.create.useMutation({
    onSuccess: data => {
      toast.success(`Member ${data.memberCode} saved.`);
      setForm(defaultForm);
      setConfirmed(false);
      utils.member.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const update = trpc.member.update.useMutation({
    onSuccess: () => {
      toast.success("Central record updated.");
      utils.member.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const chooseExisting = (member: (typeof matchedMembers)[number]) => {
    setExistingId(member.id);
    setForm({
      fullName: member.fullName,
      birthDateRaw: member.birthDateRaw ?? "",
      guardianName: member.guardianName ?? "",
      guardianPhone: member.guardianPhone ?? "",
      guardianEmail: member.guardianEmail ?? "",
      branch: "",
      membershipStatus: member.membershipStatus,
      classGroupIds: [],
    });
  };
  const toggleClass = (classId: number) =>
    setForm(current => ({
      ...current,
      classGroupIds: current.classGroupIds.includes(classId)
        ? current.classGroupIds.filter(id => id !== classId)
        : [...current.classGroupIds, classId],
    }));
  const submit = () => {
    if (!form.fullName || !form.branch || !form.classGroupIds.length)
      return toast.error(
        "Enter the member name, Branch, and select at least one class."
      );
    const payload = {
      ...form,
      branch: form.branch as AcademyBranch,
      birthDateRaw: form.birthDateRaw || null,
      guardianName: form.guardianName || null,
      guardianPhone: form.guardianPhone || null,
      guardianEmail: form.guardianEmail || null,
      confirmedNotDuplicate: confirmed,
    };
    if (mode === "existing" && existingId)
      update.mutate({ ...payload, memberId: existingId });
    else create.mutate(payload);
  };
  const pending = create.isPending || update.isPending;
  const switchMode = (value: Mode) => {
    setMode(value);
    setExistingId(null);
    setForm(defaultForm);
    setConfirmed(false);
  };
  const publicRegistrationUrl = `${window.location.origin}${compactRegistrationPath}`;
  const publicRegistrationMessage = `Hello, and welcome to Premier Ballet Academy. Please complete the secure Parent registration form below, review the school policy, and accept it before submitting: ${publicRegistrationUrl}`;
  const copyPublicLink = async () => {
    await navigator.clipboard.writeText(publicRegistrationUrl);
    toast.success("Public Parent registration link copied.");
  };
  const sharePublicLink = () =>
    window.open(
      `https://web.whatsapp.com/send?text=${encodeURIComponent(publicRegistrationMessage)}`,
      "_blank",
      "noopener,noreferrer"
    );

  return (
    <div className="mx-auto max-w-6xl space-y-6 fade-up">
      <section>
        <p className="eyebrow">Central registration</p>
        <h1 className="section-title mt-1">Register Families & Members</h1>
        <p className="mt-2 text-sm text-[#7b666c]">
          Both workflows write to the same protected database. Branch is
          required so registrations appear accurately in Reports.
        </p>
      </section>
      <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
        <aside className="soft-card h-fit rounded-2xl p-5">
          <p className="text-sm font-medium text-[#3d2b31]">
            Registration type
          </p>
          <div className="mt-4 space-y-2">
            <ModeButton
              active={mode === "new"}
              onClick={() => switchMode("new")}
              title="New family or member"
              body="Create a central family profile and a new Member ID."
            />
            <ModeButton
              active={mode === "existing"}
              onClick={() => setMode("existing")}
              title="Complete imported record"
              body="Add missing fields and current class enrolments."
            />
          </div>
          <div className="mt-5 rounded-xl border border-[#eaded9] bg-[#fff8f4] p-4">
            <p className="text-sm font-medium text-[#3d2b31]">
              Send Parent self-registration link
            </p>
            <p className="mt-1 text-xs leading-5 text-[#8a737a]">
              For a new Parent to complete their own form, upload ID, choose
              Member or Loyalty Member, and accept the policy.
            </p>
            <div className="mt-3 grid gap-2">
              <Button
                type="button"
                onClick={sharePublicLink}
                className="rounded-xl bg-[#7c3f52] hover:bg-[#693344]"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Send by WhatsApp
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyPublicLink}
                  className="rounded-xl border-[#dcbdae] text-[#7c3f52]"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      publicRegistrationUrl,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  className="rounded-xl border-[#dcbdae] text-[#7c3f52]"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open form
                </Button>
              </div>
            </div>
          </div>
          {mode === "existing" ? (
            <div className="mt-5 border-t border-[#eaded9] pt-5">
              <Label>Find imported record</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#aa9197]" />
                <Input
                  value={memberSearch}
                  onChange={event => setMemberSearch(event.target.value)}
                  className="pl-9"
                  placeholder="Name, email, or phone"
                />
              </div>
              <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                {matchedMembers.slice(0, 8).map(member => (
                  <button
                    key={member.id}
                    onClick={() => chooseExisting(member)}
                    className={`w-full rounded-lg p-2.5 text-left text-sm hover:bg-[#fcf3ef] ${existingId === member.id ? "bg-[#f4e5dc]" : ""}`}
                  >
                    <p className="font-medium">{member.fullName}</p>
                    <p className="text-xs text-[#9a858a]">
                      {member.memberCode} · {member.guardianPhone || "No phone"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
        <section className="soft-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#3d2b31]">
                {mode === "new"
                  ? "New registration details"
                  : "Complete member record"}
              </p>
              <p className="mt-1 text-xs text-[#9a858a]">
                The same central fields are used in both workflows.
              </p>
            </div>
            {existingId ? (
              <CheckCircle2 className="h-6 w-6 text-[#5b8264]" />
            ) : null}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field
              label="Child / member name"
              value={form.fullName}
              onChange={value => setForm({ ...form, fullName: value })}
            />
            <Field
              label="Birth date"
              value={form.birthDateRaw}
              onChange={value => setForm({ ...form, birthDateRaw: value })}
              placeholder="Example: 15/07/2020"
            />
            <Field
              label="Parent / Guardian name"
              value={form.guardianName}
              onChange={value => setForm({ ...form, guardianName: value })}
            />
            <Field
              label="Parent / Guardian phone"
              value={form.guardianPhone}
              onChange={value => setForm({ ...form, guardianPhone: value })}
            />
            <div>
              <Label>Premier Ballet branch</Label>
              <Select
                value={form.branch || undefined}
                onValueChange={value =>
                  setForm({ ...form, branch: value as AcademyBranch })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMY_BRANCHES.map(branch => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Parent / Guardian email"
                value={form.guardianEmail}
                type="email"
                onChange={value => setForm({ ...form, guardianEmail: value })}
              />
            </div>
            <div>
              <Label>Membership eligibility</Label>
              <Select
                value={form.membershipStatus}
                onValueChange={value =>
                  setForm({
                    ...form,
                    membershipStatus: value as FormState["membershipStatus"],
                  })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_enrolled">
                    Not enrolled in Loyalty
                  </SelectItem>
                  <SelectItem value="eligible">
                    Eligible for Loyalty offers
                  </SelectItem>
                  <SelectItem value="inactive">Inactive membership</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6">
            <Label>Class enrolments</Label>
            <p className="mt-1 text-xs text-[#9a858a]">
              Select every active class for this member.
            </p>
            <div className="mt-3 grid max-h-52 gap-2 overflow-y-auto rounded-xl border border-[#eaded9] p-3 sm:grid-cols-2">
              {classes.map(item => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-2 rounded-lg p-2 hover:bg-[#fcf7f4]"
                >
                  <Checkbox
                    checked={form.classGroupIds.includes(item.id)}
                    onCheckedChange={() => toggleClass(item.id)}
                  />
                  <span className="text-xs leading-5 text-[#5e4b51]">
                    <strong className="font-medium">{item.levelName}</strong>
                    <br />
                    {item.scheduleText ||
                      item.instructorName ||
                      "Schedule not specified"}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-[#fff8f4] p-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => duplicate.refetch()}
              className="rounded-xl border-[#dcbdae] text-[#7c3f52]"
            >
              Check for duplicates
            </Button>
            {duplicate.data?.length ? (
              <>
                <span className="text-xs text-[#a45c42]">
                  {duplicate.data.length} possible record(s) found.
                </span>
                <label className="flex items-center gap-2 text-xs text-[#735b62]">
                  <Checkbox
                    checked={confirmed}
                    onCheckedChange={value => setConfirmed(Boolean(value))}
                  />
                  I reviewed the records and want to continue
                </label>
              </>
            ) : duplicate.isFetched ? (
              <span className="text-xs text-[#5b8264]">
                No direct match was found with the current information.
              </span>
            ) : null}
          </div>
          <Button
            disabled={pending || (mode === "existing" && !existingId)}
            onClick={submit}
            className="mt-6 h-11 w-full rounded-xl bg-[#7c3f52] hover:bg-[#693344]"
          >
            {pending
              ? "Saving…"
              : mode === "new"
                ? "Save to central database"
                : "Save member record"}
          </Button>
        </section>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl p-4 text-left ${active ? "bg-[#7c3f52] text-white" : "bg-[#fcf8f6] text-[#5c474e]"}`}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-xs opacity-75">{body}</p>
    </button>
  );
}
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 bg-[#fffdfa]"
      />
    </div>
  );
}
