import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type OfferDraft = {
  id?: number;
  name: string;
  description: string;
  category: "class" | "workshop" | "merchandise" | "service";
  ruleType: "member_price" | "percentage_off" | "fixed_amount_off";
  listPrice: string;
  memberPrice: string;
  discountValue: string;
  requiresEligibleMembership: boolean;
  active: boolean;
};
const empty: OfferDraft = {
  name: "",
  description: "",
  category: "service",
  ruleType: "member_price",
  listPrice: "",
  memberPrice: "",
  discountValue: "",
  requiresEligibleMembership: true,
  active: true,
};
const money = (cents: number) =>
  new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP" }).format(
    cents / 100
  );

export default function Offers() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<OfferDraft>(empty);
  const { data: offers } = trpc.offer.list.useQuery();
  const utils = trpc.useUtils();
  const close = () => {
    setOpen(false);
    setDraft(empty);
  };
  const create = trpc.offer.create.useMutation({
    onSuccess: () => {
      toast.success("Offer added.");
      utils.offer.list.invalidate();
      close();
    },
    onError: err => toast.error(err.message),
  });
  const update = trpc.offer.update.useMutation({
    onSuccess: () => {
      toast.success("Offer updated.");
      utils.offer.list.invalidate();
      close();
    },
    onError: err => toast.error(err.message),
  });
  const toggle = trpc.offer.setActive.useMutation({
    onSuccess: () => utils.offer.list.invalidate(),
  });
  const save = () => {
    const payload = {
      name: draft.name,
      description: draft.description || null,
      category: draft.category,
      ruleType: draft.ruleType,
      listPriceCents: Math.round(Number(draft.listPrice) * 100),
      memberPriceCents: draft.memberPrice
        ? Math.round(Number(draft.memberPrice) * 100)
        : null,
      discountValue: draft.discountValue
        ? Math.round(
            Number(draft.discountValue) *
              (draft.ruleType === "fixed_amount_off" ? 100 : 1)
          )
        : null,
      requiresEligibleMembership: draft.requiresEligibleMembership,
      active: draft.active,
    };
    if (!draft.name || Number.isNaN(payload.listPriceCents))
      return toast.error("Enter an offer name and list price.");
    if (draft.id) update.mutate({ id: draft.id, ...payload });
    else create.mutate(payload);
  };
  const edit = (offer: NonNullable<typeof offers>[number]) => {
    setDraft({
      id: offer.id,
      name: offer.name,
      description: offer.description ?? "",
      category: offer.category,
      ruleType: offer.ruleType,
      listPrice: String(offer.listPriceCents / 100),
      memberPrice: offer.memberPriceCents
        ? String(offer.memberPriceCents / 100)
        : "",
      discountValue: offer.discountValue
        ? String(
            offer.ruleType === "fixed_amount_off"
              ? offer.discountValue / 100
              : offer.discountValue
          )
        : "",
      requiresEligibleMembership: offer.requiresEligibleMembership,
      active: offer.active,
    });
    setOpen(true);
  };
  return (
    <div className="mx-auto max-w-6xl space-y-6 fade-up">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">No-code pricing</p>
          <h1 className="section-title mt-1">Dynamic Offers & Pricing</h1>
          <p className="mt-2 text-sm text-[#7b666c]">
            Add, replace, activate, or retire offers here. Changes apply
            immediately in Point of Sale.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="h-11 rounded-xl bg-[#7c3f52]"
        >
          <Plus className="mr-2 h-4 w-4" />
          New offer
        </Button>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {offers?.map(offer => (
          <article key={offer.id} className="soft-card rounded-2xl p-5">
            <div className="flex justify-between gap-3">
              <div>
                <Badge
                  className={
                    offer.active
                      ? "bg-[#e6eee5] text-[#50775d]"
                      : "bg-[#f1e8e5] text-[#8c626b]"
                  }
                >
                  {offer.active ? "Active" : "Inactive"}
                </Badge>
                <h2 className="mt-3 font-serif text-xl text-[#302126]">
                  {offer.name}
                </h2>
                <p className="mt-1 min-h-10 text-xs leading-5 text-[#8f787f]">
                  {offer.description || "No description"}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => edit(offer)}
                className="text-[#7c3f52]"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-5 rounded-xl bg-[#fcf8f6] p-3">
              <p className="text-xs text-[#8f787f]">List price</p>
              <p className="mt-1 font-medium text-[#3d2b31]">
                {money(offer.listPriceCents)}
              </p>
              <p className="mt-2 text-xs text-[#7c3f52]">
                {offer.ruleType === "member_price"
                  ? `Member price: ${money(offer.memberPriceCents ?? offer.listPriceCents)}`
                  : offer.ruleType === "percentage_off"
                    ? `Discount: ${offer.discountValue ?? 0}%`
                    : `Fixed discount: ${money(offer.discountValue ?? 0)}`}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-[#756168]">
                Eligible membership required
              </span>
              <Switch
                checked={offer.active}
                onCheckedChange={active =>
                  toggle.mutate({ offerId: offer.id, active })
                }
              />
            </div>
          </article>
        ))}
      </section>
      <Dialog open={open} onOpenChange={value => !value && close()}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {draft.id ? "Edit offer" : "New offer"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Offer name"
              value={draft.name}
              onChange={value => setDraft({ ...draft, name: value })}
            />
            <div>
              <Label>Category</Label>
              <Select
                value={draft.category}
                onValueChange={value =>
                  setDraft({
                    ...draft,
                    category: value as OfferDraft["category"],
                  })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="merchandise">Merchandise</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={draft.description}
                onChange={e =>
                  setDraft({ ...draft, description: e.target.value })
                }
                className="mt-2"
              />
            </div>
            <FormInput
              label="List price (EGP)"
              value={draft.listPrice}
              onChange={value => setDraft({ ...draft, listPrice: value })}
              type="number"
            />
            <div>
              <Label>Member pricing rule</Label>
              <Select
                value={draft.ruleType}
                onValueChange={value =>
                  setDraft({
                    ...draft,
                    ruleType: value as OfferDraft["ruleType"],
                    memberPrice: "",
                    discountValue: "",
                  })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member_price">
                    Fixed member price
                  </SelectItem>
                  <SelectItem value="percentage_off">Percentage off</SelectItem>
                  <SelectItem value="fixed_amount_off">
                    Fixed amount off
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {draft.ruleType === "member_price" ? (
              <FormInput
                label="Member price (EGP)"
                value={draft.memberPrice}
                onChange={value => setDraft({ ...draft, memberPrice: value })}
                type="number"
              />
            ) : (
              <FormInput
                label={
                  draft.ruleType === "percentage_off"
                    ? "Discount (%)"
                    : "Discount (EGP)"
                }
                value={draft.discountValue}
                onChange={value => setDraft({ ...draft, discountValue: value })}
                type="number"
              />
            )}
            <div className="flex items-end gap-3">
              <Switch
                checked={draft.requiresEligibleMembership}
                onCheckedChange={value =>
                  setDraft({ ...draft, requiresEligibleMembership: value })
                }
              />
              <Label>Eligible membership required</Label>
            </div>
            <div className="flex items-end gap-3">
              <Switch
                checked={draft.active}
                onCheckedChange={value => setDraft({ ...draft, active: value })}
              />
              <Label>Offer active</Label>
            </div>
          </div>
          <Button
            disabled={create.isPending || update.isPending}
            onClick={save}
            className="mt-5 w-full bg-[#7c3f52]"
          >
            Save offer
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function FormInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-2"
      />
    </div>
  );
}
