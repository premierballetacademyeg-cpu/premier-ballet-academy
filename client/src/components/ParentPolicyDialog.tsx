import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, FileText } from "lucide-react";

export const parentPolicyVersion = "PBA-2026-2027";
export const parentPolicyDocumentUrl =
  "/manus-storage/premier-ballet-academy-school-policy-2026-2027_353b82f0.docx";

export function ParentPolicyDialog({
  open,
  onOpenChange,
  accepted = false,
  onAccepted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accepted?: boolean;
  onAccepted?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] max-w-3xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[#956472]">
            Approved policy · {parentPolicyVersion}
          </p>
          <DialogTitle className="font-serif text-2xl">
            Premier Ballet Academy — School Policies and Guidelines
          </DialogTitle>
        </DialogHeader>
        <a
          href={parentPolicyDocumentUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#ead6cf] bg-[#fff9f7] px-4 py-3 text-sm font-medium text-[#7c3f52] hover:bg-[#fff3ef]"
        >
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Open or download the approved policy document
          </span>
          <ExternalLink className="h-4 w-4 shrink-0" />
        </a>
        <div className="space-y-5 text-sm leading-7 text-[#5d474f]">
          <p>
            Welcome to Premier Ballet Academy. We are proud to be an academic
            institution dedicated to the highest standards of ballet training.
            Please review the following guidelines, which help maintain a
            structured, respectful, and professional learning environment.
          </p>
          <section>
            <h3 className="font-semibold text-[#3c2a31]">1. We are a school</h3>
            <p>
              Premier Ballet Academy is not a club or recreational centre. We
              are an academic ballet school committed to structured,
              progressive, and disciplined training aligned with professional
              ballet education standards.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-[#3c2a31]">2. Season duration</h3>
            <p>
              The academic season runs for 11 months, from September through
              July. National holidays, the winter break (30 December–3 January),
              and the spring break (Coptic Easter / Sham El Nessim holiday) do
              not reduce or alter the monthly tuition fee.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-[#3c2a31]">
              3. Fees and payment policy
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                The monthly fee is equal for each of the 11 academic months and
                is expected on time regardless of attendance.
              </li>
              <li>
                A class place is reserved for the student; tuition secures that
                place and supports the Academy’s ongoing operation.
              </li>
              <li>
                Missed classes do not result in fee reductions or credits,
                except for serious illness supported by documentation.
              </li>
              <li>
                Each student is entitled to two make-up sessions per month
                according to the existing schedule.
              </li>
            </ul>
            <h4 className="mt-3 font-medium text-[#3c2a31]">Payment window</h4>
            <p>
              Payments are due from the 25th of the current month through the
              10th of the following month. A 300 EGP penalty applies afterward.
              Requests for a payment-deadline exception must be submitted and
              approved in advance; requests after the deadline are not accepted.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-[#3c2a31]">
              Loyalty Program option
            </h3>
            <p>
              The annual Loyalty Card fee is 2,500 EGP and is non-refundable. It
              provides a discounted tuition price list and a 10% discount on
              performances and workshops. Families without a Loyalty Card follow
              the standard price list and are not eligible for those discounts.
              The program may be joined at any time; applicable discounts start
              upon activation. A Loyalty Card remains valid until the end of the
              2026/2027 academic year (the end of July 2027), regardless of its
              activation date.
            </p>
            <p className="mt-2">
              Accepted payment methods are cash, Visa, and Instapay.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-[#3c2a31]">
              4. Uniform requirement
            </h3>
            <p>
              The proper Academy uniform is mandatory during class in accordance
              with each level’s requirements. For classical ballet classes, the
              official Academy uniform is strictly required and hair must be
              neatly styled in a classical ballet bun at all times.
            </p>
          </section>
          <p className="italic">
            Thank you for being part of Premier Ballet Academy. Your cooperation
            helps us provide a focused and enriching learning experience for
            every student.
          </p>
        </div>
        <Button
          onClick={() => {
            onAccepted?.();
            onOpenChange(false);
          }}
          disabled={accepted}
          className="mt-1 bg-[#7c3f52] hover:bg-[#693344]"
        >
          {accepted
            ? "Policy accepted"
            : "I have read the policy and accept it"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
