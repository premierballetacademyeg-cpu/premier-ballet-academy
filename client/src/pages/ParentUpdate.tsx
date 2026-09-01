import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ParentPolicyDialog,
  parentPolicyDocumentUrl,
  parentPolicyVersion,
} from "@/components/ParentPolicyDialog";
import { parentUpdateTokenFromLocation } from "@/lib/parentLinks";
import { trpc } from "@/lib/trpc";
import { ACADEMY_BRANCHES } from "@shared/const";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const logoUrl = "/manus-storage/premier-ballet-academy-logo_309ebba2.png";
type FormState = {
  childName: string;
  birthDate: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  emergencyPhone: string;
  regularSchool: string;
  branch: (typeof ACADEMY_BRANCHES)[number] | "";
  medicalCondition: "yes" | "no";
  medicalDetails: string;
};

const emptyForm: FormState = {
  childName: "",
  birthDate: "",
  guardianName: "",
  guardianEmail: "",
  guardianPhone: "",
  emergencyPhone: "",
  regularSchool: "",
  branch: "",
  medicalCondition: "no",
  medicalDetails: "",
};

export default function ParentUpdate() {
  const token = useMemo(
    () =>
      parentUpdateTokenFromLocation(
        window.location.search,
        window.location.pathname
      ),
    []
  );
  const { data, isLoading, error } = trpc.parentUpdate.getByToken.useQuery(
    { token },
    { enabled: Boolean(token) }
  );
  const [form, setForm] = useState<FormState>(emptyForm);
  const [initialized, setInitialized] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [completion, setCompletion] = useState<{ success: boolean } | null>(
    null
  );
  const phoneDigits = form.guardianPhone.replace(/\D/g, "");
  const shouldCheckPhone = initialized && phoneDigits.length >= 10;
  const duplicatePhone = trpc.parentUpdate.checkGuardianPhone.useQuery(
    { token, guardianPhone: form.guardianPhone },
    { enabled: Boolean(token) && shouldCheckPhone, retry: false }
  );
  const phoneAlreadyUsed = duplicatePhone.data?.inUse === true;
  const phoneCheckPending = shouldCheckPhone && duplicatePhone.isFetching;

  useEffect(() => {
    if (!data || initialized) return;
    setForm({
      childName: data.childName ?? "",
      birthDate: data.birthDate ?? "",
      guardianName: data.guardianName ?? "",
      guardianEmail: data.guardianEmail ?? "",
      guardianPhone: data.guardianPhone ?? "",
      emergencyPhone: data.emergencyPhone ?? "",
      regularSchool: data.regularSchool ?? "",
      branch: ACADEMY_BRANCHES.includes(
        data.branch as (typeof ACADEMY_BRANCHES)[number]
      )
        ? (data.branch as (typeof ACADEMY_BRANCHES)[number])
        : "",
      medicalCondition: data.medicalCondition ?? "no",
      medicalDetails: data.medicalDetails ?? "",
    });
    setInitialized(true);
  }, [data, initialized]);

  const submit = trpc.parentUpdate.submit.useMutation({
    onSuccess: () => {
      setCompletion({ success: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: issue => toast.error(issue.message),
  });
  const { data: instapay } = trpc.payment.instapayUrl.useQuery();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(current => ({ ...current, [key]: value }));

  const isComplete =
    policyAccepted &&
    shouldCheckPhone &&
    !phoneAlreadyUsed &&
    !phoneCheckPending &&
    Boolean(
      form.childName &&
        form.birthDate &&
        form.guardianName &&
        form.guardianEmail &&
        form.emergencyPhone &&
        form.regularSchool &&
        form.branch
    ) &&
    (form.medicalCondition === "no" || Boolean(form.medicalDetails.trim()));
  const submitForm = () => {
    if (phoneAlreadyUsed)
      return toast.error(
        "This phone number is already connected to another Premier Ballet family. Please use a different number or contact the Academy."
      );
    if (!isComplete)
      return toast.error(
        "Please complete every required field and accept the School Policy inside the policy window."
      );
    submit.mutate({
      token,
      ...form,
      branch: form.branch as (typeof ACADEMY_BRANCHES)[number],
      medicalDetails:
        form.medicalCondition === "yes" ? form.medicalDetails : null,
      membershipTier: "member",
      policyAccepted: true,
    });
  };

  if (!token || error)
    return (
      <PublicShell>
        <StatusPanel
          icon={<AlertCircle />}
          title="This update link is unavailable"
          body="Please contact Premier Ballet Academy for a new secure Parent update link."
        />
      </PublicShell>
    );
  if (isLoading || !initialized)
    return (
      <PublicShell>
        <div className="py-28 text-center text-sm text-[#7d676f]">
          Loading your secure profile…
        </div>
      </PublicShell>
    );
  if (completion)
    return (
      <PublicShell>
        <div className="mx-auto max-w-md px-5 py-24 text-center">
          <StatusPanel
            icon={<CheckCircle2 />}
            title="Thank you for your update"
            body="Your profile updates and School Policy acceptance have been saved successfully."
            success
          />
        </div>
      </PublicShell>
    );

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-7 sm:py-10">
        <header className="mb-7 text-center">
          <img
            src={logoUrl}
            alt="Premier Ballet Academy"
            className="mx-auto h-20 w-24 object-contain sm:h-24 sm:w-28"
          />
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[.23em] text-[#956472]">
            Premier Ballet Academy
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#2e2025] sm:text-5xl">
            Parent Profile Update
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#7a646c]">
            Please review your family information, choose your membership
            option, and confirm the School Policy.
          </p>
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-[#f0c5c8] bg-[#fff1f1] px-4 py-2 text-xs font-semibold text-[#a23f48]">
            <AlertCircle className="h-4 w-4" />
            Policy acceptance: Pending
          </div>
        </header>

        <div className="mb-5 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold uppercase tracking-[.1em] sm:text-xs">
          <ProgressStep number="01" label="Your details" active />
          <ProgressStep number="02" label="Membership" active />
          <ProgressStep
            number="03"
            label="Confirm policy"
            active={policyAccepted}
          />
        </div>

        <main className="space-y-6 rounded-[1.9rem] border border-white/70 bg-white p-5 shadow-[0_24px_80px_rgba(74,43,52,.14)] sm:p-8">
          <section className="flex flex-col gap-3 rounded-2xl bg-[#f9f2f0] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[#936776]">
                Secure member record
              </p>
              <p className="mt-1 font-serif text-xl text-[#35242b]">
                {data?.childName}{" "}
                <span className="font-sans text-xs text-[#916d78]">
                  · {data?.memberCode}
                </span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#80656d]">
              <LockKeyhole className="h-3.5 w-3.5" />
              Private link
            </span>
          </section>

          <section>
            <SectionTitle
              eyebrow="01 · Family information"
              title="Review your details"
              body="Update anything that has changed. Every field is required."
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Child’s full name">
                <Input
                  value={form.childName}
                  onChange={event => update("childName", event.target.value)}
                />
              </Field>
              <Field label="Birth date">
                <Input
                  value={form.birthDate}
                  onChange={event => update("birthDate", event.target.value)}
                  placeholder="DD/MM/YYYY"
                />
              </Field>
              <Field label="Parent / Guardian name">
                <Input
                  value={form.guardianName}
                  onChange={event => update("guardianName", event.target.value)}
                />
              </Field>
              <Field label="Parent / Guardian email">
                <Input
                  type="email"
                  value={form.guardianEmail}
                  onChange={event =>
                    update("guardianEmail", event.target.value)
                  }
                />
              </Field>
              <Field label="Parent / Guardian phone">
                <Input
                  inputMode="tel"
                  autoComplete="new-password"
                  aria-describedby="guardian-phone-status"
                  value={form.guardianPhone}
                  onChange={event =>
                    update("guardianPhone", event.target.value)
                  }
                />
                {phoneCheckPending ? (
                  <p
                    id="guardian-phone-status"
                    className="mt-2 text-xs text-[#80656d]"
                  >
                    Checking this phone number…
                  </p>
                ) : phoneAlreadyUsed ? (
                  <p
                    id="guardian-phone-status"
                    className="mt-2 rounded-lg bg-[#fff0f0] px-3 py-2 text-xs font-medium leading-5 text-[#a33d46]"
                  >
                    This number belongs to another Premier Ballet family.
                    Automatic form completion is stopped; enter a different
                    number or contact the Academy.
                  </p>
                ) : null}
              </Field>
              <Field label="Emergency phone number">
                <Input
                  inputMode="tel"
                  value={form.emergencyPhone}
                  onChange={event =>
                    update("emergencyPhone", event.target.value)
                  }
                />
              </Field>
              <Field label="Regular school">
                <Input
                  value={form.regularSchool}
                  onChange={event =>
                    update("regularSchool", event.target.value)
                  }
                />
              </Field>
              <Field label="Premier Ballet branch">
                <Select
                  value={form.branch || undefined}
                  onValueChange={value =>
                    update("branch", value as (typeof ACADEMY_BRANCHES)[number])
                  }
                >
                  <SelectTrigger>
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
              </Field>
              <Field label="Any medical condition?">
                <Select
                  value={form.medicalCondition}
                  onValueChange={value =>
                    update("medicalCondition", value as "yes" | "no")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {form.medicalCondition === "yes" ? (
              <div className="mt-4">
                <Field label="Medical condition details">
                  <Textarea
                    value={form.medicalDetails}
                    onChange={event =>
                      update("medicalDetails", event.target.value)
                    }
                    placeholder="Please provide relevant details…"
                  />
                </Field>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl bg-[#f8f2f0] p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#875064]" />
                  <h2 className="font-serif text-xl text-[#34272c]">
                    School Policy
                  </h2>
                </div>
                <p className="mt-2 max-w-lg text-sm leading-6 text-[#7d676f]">
                  Read the approved policy in the window and use its
                  acknowledgement button to accept it.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPolicyOpen(true)}
                  className="rounded-xl border-[#d7acb7] text-[#7c3f52]"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {policyAccepted ? "Policy accepted" : "Read policy"}
                </Button>
                <a
                  href={parentPolicyDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center rounded-xl px-2 text-xs font-medium text-[#7c3f52] underline"
                >
                  Document
                </a>
              </div>
            </div>
            <p
              className={`mt-4 rounded-xl px-4 py-3 text-sm ${policyAccepted ? "bg-[#edf6ed] text-[#50775d]" : "bg-white text-[#7d676f]"}`}
            >
              {policyAccepted
                ? "Policy accepted from the policy window. You may now submit when the remaining required fields are complete."
                : "Policy acceptance is required and can only be completed from the policy window."}
            </p>
          </section>

          <div className="space-y-3">
            <Button
              className="h-12 w-full rounded-xl bg-[#7c3f52] text-base shadow-[0_10px_18px_rgba(124,63,82,.2)] hover:bg-[#693344]"
              disabled={!isComplete || submit.isPending}
              onClick={submitForm}
            >
              {submit.isPending
                ? "Saving your profile."
                : "Confirm details & submit"}
            </Button>
            {instapay?.url ? (
              <a
                href={instapay.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 w-full items-center justify-center rounded-xl border border-[#d9afa0] bg-[#fffaf8] text-base font-medium text-[#7c3f52] hover:bg-[#fcf4f0]"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Renew / Upgrade to Loyalty via Instapay
              </a>
            ) : null}
          </div>
        </main>
      </div>

      <ParentPolicyDialog
        open={policyOpen}
        onOpenChange={setPolicyOpen}
        accepted={policyAccepted}
        onAccepted={() => setPolicyAccepted(true)}
      />
    </PublicShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <Label className="mb-2 block text-sm font-medium text-[#49353c]">
        {label}
      </Label>
      {children}
    </label>
  );
}
function SectionTitle({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[#956472]">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-serif text-2xl text-[#34272c]">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[#7e6870]">{body}</p>
    </div>
  );
}
function ProgressStep({
  number,
  label,
  active,
}: {
  number: string;
  label: string;
  active: boolean;
}) {
  return (
    <div className={active ? "text-[#7c3f52]" : "text-[#b59da4]"}>
      <span
        className={`mx-auto mb-1 grid h-6 w-6 place-items-center rounded-full text-[9px] ${active ? "bg-[#7c3f52] text-white" : "bg-[#eadde0] text-[#9a7f87]"}`}
      >
        {number}
      </span>
      {label}
    </div>
  );
}
function MembershipOption({
  selected,
  onClick,
  label,
  description,
  tone,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description: string;
  tone: "pink" | "gold";
}) {
  const classes =
    tone === "gold"
      ? selected
        ? "border-[#b9955d] bg-[#fffaf0]"
        : "border-[#eaded9] bg-white"
      : selected
        ? "border-[#cf8999] bg-[#fff3f6]"
        : "border-[#eaded9] bg-white";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${classes}`}
    >
      <p className="font-medium text-[#462d35]">{label}</p>
      <p className="mt-1 text-xs leading-5 text-[#826b72]">{description}</p>
    </button>
  );
}
function StatusPanel({
  icon,
  title,
  body,
  success = false,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  success?: boolean;
}) {
  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <div
        className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${success ? "bg-[#e6eee5] text-[#50775d]" : "bg-[#fff0f0] text-[#a33d46]"}`}
      >
        {icon}
      </div>
      <h1 className="mt-5 font-serif text-3xl text-[#302126]">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-[#76636a]">{body}</p>
    </div>
  );
}
function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_86%_0%,#f4dce1,transparent_31%),radial-gradient(circle_at_0%_18%,#fff5ef,transparent_27%),#fbf7f3]">
      {children}
    </div>
  );
}
