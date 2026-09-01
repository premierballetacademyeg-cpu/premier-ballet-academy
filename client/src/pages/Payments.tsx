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
import { trpc } from "@/lib/trpc";
import {
  Banknote,
  CheckCircle2,
  ExternalLink,
  ReceiptText,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const whatsappNumber = "201000305053";
type PaymentType = "registration" | "membership" | "tuition" | "other";

export default function Payments() {
  const utils = trpc.useUtils();
  const { data: payments = [], isLoading } = trpc.payment.list.useQuery();
  const create = trpc.payment.create.useMutation({
    onSuccess: () => utils.payment.list.invalidate(),
    onError: issue => toast.error(issue.message),
  });
  const review = trpc.payment.review.useMutation({
    onSuccess: () => utils.payment.list.invalidate(),
    onError: issue => toast.error(issue.message),
  });
  const [memberId, setMemberId] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("membership");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const createRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Math.round(Number(amount) * 100);
    if (!Number(memberId) || !Number.isFinite(value) || value <= 0)
      return toast.error("Enter a valid Member ID and amount.");
    const result = await create.mutateAsync({
      memberId: Number(memberId),
      paymentType,
      amountCents: value,
      note: note || null,
    });
    const message = `Premier Ballet Academy payment request #${result.paymentId}. Please complete your payment via Instapay, then send your receipt here for review.`;
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
    window.open(result.instapayUrl, "_blank", "noopener,noreferrer");
    setMemberId("");
    setAmount("");
    setNote("");
    toast.success(
      "Payment request created. Instapay and WhatsApp were opened."
    );
  };
  const statusTone = (status: string) =>
    status === "approved"
      ? "bg-[#e7f1e8] text-[#41724d]"
      : status === "rejected"
        ? "bg-[#fff0ef] text-[#a44b45]"
        : status === "under_review"
          ? "bg-[#fff7e6] text-[#976c20]"
          : "bg-[#f5e5dc] text-[#7c3f52]";
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <section className="rounded-[2rem] bg-[#302126] p-7 text-[#fffaf7] md:p-9">
        <p className="eyebrow text-[#d6a792]">Payment control</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="font-serif text-4xl">Instapay review</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#eaded9]">
              Create a payment request, send the Parent to Instapay, then
              activate the relevant membership or service only after their
              receipt has been checked.
            </p>
          </div>
          <Banknote className="h-11 w-11 text-[#d6a792]" />
        </div>
      </section>
      <div className="grid gap-7 lg:grid-cols-[.85fr_1.15fr]">
        <form
          onSubmit={createRequest}
          className="soft-card rounded-3xl p-6 space-y-4"
        >
          <div>
            <p className="eyebrow">New request</p>
            <h2 className="section-title mt-1">Request an Instapay payment</h2>
          </div>
          <div>
            <Label>Member ID</Label>
            <Input
              type="number"
              value={memberId}
              onChange={e => setMemberId(e.target.value)}
              className="mt-2 h-11 rounded-xl"
              placeholder="Central member numeric ID"
              required
            />
          </div>
          <div>
            <Label>Payment type</Label>
            <Select
              value={paymentType}
              onValueChange={value => setPaymentType(value as PaymentType)}
            >
              <SelectTrigger className="mt-2 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registration">Registration</SelectItem>
                <SelectItem value="membership">Membership</SelectItem>
                <SelectItem value="tuition">Tuition</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount (EGP)</Label>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="mt-2 h-11 rounded-xl"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <Label>Internal note</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              className="mt-2"
              placeholder="Optional context for the team"
            />
          </div>
          <Button
            disabled={create.isPending}
            className="h-11 w-full rounded-xl bg-[#7c3f52] hover:bg-[#693344]"
          >
            <ExternalLink className="h-4 w-4" />
            Create request & open Instapay
          </Button>
        </form>
        <section className="soft-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Review queue</p>
              <h2 className="section-title mt-1">Payment requests</h2>
            </div>
            <ReceiptText className="h-7 w-7 text-[#a56c79]" />
          </div>
          <div className="mt-5 space-y-3">
            {isLoading ? (
              <p className="text-sm text-[#76666b]">
                Loading payment requests…
              </p>
            ) : payments.length ? (
              payments.map(item => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#eaded9] bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#302126]">
                        {item.memberName}{" "}
                        <span className="text-xs text-[#8d7b80]">
                          · {item.memberCode}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-[#76666b]">
                        {item.paymentType} · EGP{" "}
                        {(item.amountCents / 100).toFixed(2)}
                      </p>
                      {item.note ? (
                        <p className="mt-1 text-xs text-[#8d7b80]">
                          {item.note}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.status)}`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={item.instapayUrl} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open Instapay
                      </Button>
                    </a>
                    {item.status === "pending_receipt" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          review.mutate({
                            paymentId: item.id,
                            status: "under_review",
                          })
                        }
                      >
                        Mark under review
                      </Button>
                    ) : null}
                    {item.status !== "approved" ? (
                      <Button
                        size="sm"
                        className="bg-[#50775d] hover:bg-[#41634c]"
                        onClick={() =>
                          review.mutate({
                            paymentId: item.id,
                            status: "approved",
                          })
                        }
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve & activate
                      </Button>
                    ) : null}
                    {item.status !== "rejected" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[#a44b45]"
                        onClick={() =>
                          review.mutate({
                            paymentId: item.id,
                            status: "rejected",
                          })
                        }
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-[#fbf7f3] p-5 text-sm text-[#8d7b80]">
                No payment requests have been created yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
