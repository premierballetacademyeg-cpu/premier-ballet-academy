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
import { Textarea } from "@/components/ui/textarea";
import {
  ParentPolicyDialog,
  parentPolicyDocumentUrl,
} from "@/components/ParentPolicyDialog";
import { trpc } from "@/lib/trpc";
import { ACADEMY_BRANCHES } from "@shared/const";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  HeartPulse,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { ChangeEvent, ReactNode, useState } from "react";
import { toast } from "sonner";

const logoUrl = "/manus-storage/premier-ballet-academy-logo_309ebba2.png";
type AcademyBranch = (typeof ACADEMY_BRANCHES)[number];
type MedicalChoice = "" | "yes" | "no";
type FormState = {
  childName: string;
  birthDate: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  emergencyPhone: string;
  regularSchool: string;
  branch: AcademyBranch | "";
  medicalCondition: MedicalChoice;
  medicalDetails: string;
};
const initialForm: FormState = {
  childName: "",
  birthDate: "",
  guardianName: "",
  guardianEmail: "",
  guardianPhone: "",
  emergencyPhone: "",
  regularSchool: "",
  branch: "",
  medicalCondition: "",
  medicalDetails: "",
};

export default function ParentRegistration() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [fileName, setFileName] = useState("");
  const [confirmation, setConfirmation] = useState<{
    memberCode: string;
  } | null>(null);
  const phoneDigits = form.guardianPhone.replace(/\D/g, "");
  const shouldCheckPhone = phoneDigits.length >= 10;
  const duplicatePhone = trpc.parentRegistration.checkGuardianPhone.useQuery(
    { guardianPhone: form.guardianPhone },
    { enabled: shouldCheckPhone, retry: false }
  );
  const phoneLocked = duplicatePhone.data?.inUse === true;
  const phoneChecking = shouldCheckPhone && duplicatePhone.isFetching;
  const { data: instapay } = trpc.payment.instapayUrl.useQuery();
  const submit = trpc.parentRegistration.submit.useMutation({
    onSuccess: result => {
      setConfirmation({ memberCode: result.memberCode });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: issue => toast.error(issue.message),
  });
  const setValue = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(current => ({ ...current, [key]: value }));
  const complete =
    policyAccepted &&
    shouldCheckPhone &&
    !phoneLocked &&
    !phoneChecking &&
    Boolean(
      form.childName &&
        form.birthDate &&
        form.guardianName &&
        form.guardianEmail &&
        form.emergencyPhone &&
        form.regularSchool &&
        form.branch &&
        form.medicalCondition
    ) &&
    (form.medicalCondition === "no" || Boolean(form.medicalDetails.trim()));
  const submitForm = () => {
    if (phoneLocked)
      return toast.error(
        "This phone number is already registered. Please enter a different number or contact Premier Ballet Academy."
      );
    if (!complete)
      return toast.error(
        "Please complete every required field and accept the School Policy inside the policy window."
      );
    submit.mutate({
      ...form,
      branch: form.branch as AcademyBranch,
      medicalCondition: form.medicalCondition as "yes" | "no",
      medicalDetails:
        form.medicalCondition === "yes" ? form.medicalDetails : null,
      membershipTier: "member",
      policyAccepted: true,
    });
  };

  if (confirmation)
    return (
      <PublicShell>
        <div className="mx-auto max-w-md px-5 py-24 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e6eee5] text-[#50775d]">
            <CheckCircle2 />
          </div>
          <h1 className="mt-5 font-serif text-3xl text-[#302126]">
            Registration received
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#76636a]">
            Your information and policy acceptance have been saved securely.
            Your Premier Ballet Member ID is:
          </p>
          <p className="mt-5 rounded-2xl bg-white px-5 py-4 font-serif text-2xl tracking-wide text-[#7c3f52] shadow-sm">
            {confirmation.memberCode}
          </p>
          <p className="mt-5 text-sm leading-6 text-[#76636a]">
            The Academy will review membership activation and payment
            requirements before issuing the final digital card.
          </p>
          {instapay?.url ? (
            <a
              href={instapay.url}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#7c3f52] px-5 text-sm font-medium text-white hover:bg-[#693344]"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Instapay
            </a>
          ) : null}
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
            Parent Registration
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#7a646c]">
            Please complete each required field below. Your details are saved
            securely in the Academy’s central system.
          </p>
        </header>
        <form
          autoComplete="off"
          onSubmit={event => {
            event.preventDefault();
            submitForm();
          }}
          className="space-y-7 rounded-[1.9rem] border border-white/70 bg-white p-5 shadow-[0_24px_80px_rgba(74,43,52,.14)] sm:p-8"
        >
          <section>
            <SectionTitle
              eyebrow="01 · Family information"
              title="Tell us about your child"
              body="Fields marked * are required."
            />
            <div className="mt-5">
              <Field label="Parent / Guardian phone number" required>
                <Input
                  required
                  inputMode="tel"
                  autoComplete="new-password"
                  aria-describedby="guardian-phone-status"
                  value={form.guardianPhone}
                  onChange={event =>
                    setValue("guardianPhone", event.target.value)
                  }
                />
                {phoneChecking ? (
                  <p
                    id="guardian-phone-status"
                    className="mt-2 text-xs text-[#80656d]"
                  >
                    Checking this phone number…
                  </p>
                ) : phoneLocked ? (
                  <p
                    id="guardian-phone-status"
                    className="mt-2 rounded-lg bg-[#fff0f0] px-3 py-2 text-xs font-medium leading-5 text-[#a33d46]"
                  >
                    This number is already registered. The rest of the form is
                    locked until you enter a different, unused number.
                  </p>
                ) : null}
              </Field>
            </div>
            <fieldset
              disabled={phoneLocked}
              className={`mt-4 space-y-4 ${phoneLocked ? "opacity-50" : ""}`}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Child’s full name" required>
                  <Input
                    required
                    autoComplete="new-password"
                    value={form.childName}
                    onChange={event =>
                      setValue("childName", event.target.value)
                    }
                  />
                </Field>
                <Field label="Birth date" required>
                  <Input
                    required
                    type="date"
                    value={form.birthDate}
                    onChange={event =>
                      setValue("birthDate", event.target.value)
                    }
                  />
                </Field>
                <Field label="Parent / Guardian name" required>
                  <Input
                    required
                    autoComplete="new-password"
                    value={form.guardianName}
                    onChange={event =>
                      setValue("guardianName", event.target.value)
                    }
                  />
                </Field>
                <Field label="Parent / Guardian email" required>
                  <Input
                    required
                    type="email"
                    autoComplete="new-password"
                    value={form.guardianEmail}
                    onChange={event =>
                      setValue("guardianEmail", event.target.value)
                    }
                  />
                </Field>
                <Field label="Another number in case of emergency" required>
                  <Input
                    required
                    inputMode="tel"
                    autoComplete="new-password"
                    value={form.emergencyPhone}
                    onChange={event =>
                      setValue("emergencyPhone", event.target.value)
                    }
                  />
                </Field>
                <Field label="Regular school" required>
                  <Input
                    required
                    autoComplete="new-password"
                    value={form.regularSchool}
                    onChange={event =>
                      setValue("regularSchool", event.target.value)
                    }
                  />
                </Field>
                <Field label="Premier Ballet branch" required>
                  <Select
                    value={form.branch || undefined}
                    onValueChange={value =>
                      setValue("branch", value as AcademyBranch)
                    }
                  >
                    <SelectTrigger aria-required="true">
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
                <Field label="Any medical condition?" required>
                  <Select
                    value={form.medicalCondition || undefined}
                    onValueChange={value =>
                      setValue("medicalCondition", value as MedicalChoice)
                    }
                  >
                    <SelectTrigger aria-required="true">
                      <SelectValue placeholder="Select Yes or No" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              {form.medicalCondition === "yes" ? (
                <Field label="Medical condition details" required>
                  <Textarea
                    required
                    value={form.medicalDetails}
                    onChange={event =>
                      setValue("medicalDetails", event.target.value)
                    }
                    placeholder="Please provide relevant details…"
                  />
                </Field>
              ) : null}
            </fieldset>
          </section>
          <fieldset
            disabled={phoneLocked}
            className={`space-y-7 ${phoneLocked ? "opacity-50" : ""}`}
          >

            <section className="rounded-2xl bg-[#f8f2f0] p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#875064]" />
                    <h2 className="font-serif text-xl text-[#34272c]">
                      School Policy
                    </h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#7d676f]">
                    Read the approved School Policy in the window and use its
                    acknowledgement button to accept it.
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    disabled={phoneLocked}
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
          </fieldset>
          <div className="space-y-3">
            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-[#7c3f52] text-base shadow-[0_10px_18px_rgba(124,63,82,.2)] hover:bg-[#693344]"
              disabled={!complete || submit.isPending}
            >
              {submit.isPending
                ? "Saving your registration…"
                : "Submit registration"}
            </Button>
            {instapay?.url ? (
              <a
                href={instapay.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 w-full items-center justify-center rounded-xl border border-[#d9afa0] bg-[#fffaf8] text-base font-medium text-[#7c3f52] hover:bg-[#fcf4f0]"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Pay Registration / Upgrade via Instapay
              </a>
            ) : null}
          </div>
        </form>
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
function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <Label className="mb-2 block text-sm font-medium text-[#49353c]">
        {label}
        {required ? <span className="ml-1 text-[#a33d46]">*</span> : null}
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
function MembershipOption({
  selected,
  onClick,
  label,
  description,
  tone,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description: string;
  tone: "pink" | "gold";
  disabled: boolean;
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
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed ${classes}`}
    >
      <p className="font-medium text-[#462d35]">{label}</p>
      <p className="mt-1 text-xs leading-5 text-[#826b72]">{description}</p>
    </button>
  );
}
function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_86%_0%,#f4dce1,transparent_31%),radial-gradient(circle_at_0%_18%,#fff5ef,transparent_27%),#fbf7f3]">
      {children}
    </div>
  );
}
