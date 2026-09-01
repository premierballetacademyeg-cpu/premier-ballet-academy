import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, CreditCard, Search, UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const money = (cents: number) =>
  new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP" }).format(
    cents / 100
  );
const memberStatus = (status: string) =>
  status === "eligible"
    ? "Loyalty eligible"
    : status === "inactive"
      ? "Inactive"
      : "Not enrolled";

export default function MemberDirectory() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [qaName, setQaName] = useState("");
  const [qaPhone, setQaPhone] = useState("");
  const trpcContext = trpc.useUtils();
  const { data: list, isLoading } = trpc.member.list.useQuery({ search });
  const { data: profile } = trpc.member.profile.useQuery(
    { memberId: selectedId ?? 0 },
    { enabled: Boolean(selectedId) }
  );
  const { data: reviews } = trpc.dashboard.duplicateReviews.useQuery();
  const issue = trpc.loyalty.issue.useMutation({
    onSuccess: () => toast.success("Digital membership card issued."),
    onError: err => toast.error(err.message),
  });
  const resolve = trpc.duplicate.resolve.useMutation({
    onSuccess: () => toast.success("Duplicate-review decision saved."),
  });
  const quickAdd = trpc.member.quickAdd.useMutation({
    onSuccess: data => {
      toast.success("Member added. Opening WhatsApp...");
      setQuickAddOpen(false);
      trpcContext.member.list.invalidate();
      const text = `Welcome to Premier Ballet! Please complete your registration here: ${window.location.origin}/p/${data.token}`;
      window.open(
        `https://wa.me/${qaPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`,
        "_blank"
      );
      setQaName("");
      setQaPhone("");
    },
    onError: err => toast.error(err.message),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 fade-up">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Central directory</p>
          <h1 className="section-title mt-1">Members & Families</h1>
          <p className="mt-2 text-sm text-[#7b666c]">
            Search by child name, parent contact, Member ID, card ID, or QR
            value.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setLocation("/register")}
            variant="outline"
            className="h-11 rounded-xl text-[#7c3f52]"
          >
            Full form
          </Button>
          <Button
            onClick={() => setQuickAddOpen(true)}
            className="h-11 rounded-xl bg-[#7c3f52] hover:bg-[#693344]"
          >
            <UserRoundPlus className="mr-2 h-4 w-4" />
            Instant Add
          </Button>
        </div>
      </section>
      <section className="soft-card rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-[#a98e95]" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search a member or Parent…"
            className="h-11 rounded-xl border-[#eaded9] bg-[#fffdfa] pl-10"
          />
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-[#eaded9] bg-white shadow-[0_12px_34px_rgba(76,49,57,.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left">
            <thead className="bg-[#fcf7f4] text-xs text-[#7f686f]">
              <tr>
                <th className="px-5 py-4 font-medium">Member</th>
                <th className="px-5 py-4 font-medium">Parent contact</th>
                <th className="px-5 py-4 font-medium">Membership</th>
                <th className="px-5 py-4 font-medium">Card</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e7e3]">
              {isLoading
                ? Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-5 py-4">
                        <Skeleton className="h-10 w-full" />
                      </td>
                    </tr>
                  ))
                : list?.map(member => (
                    <tr
                      key={member.id}
                      className="transition hover:bg-[#fffaf7]"
                    >
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
                          {member.guardianPhone || "-"}
                        </p>
                        <p className="mt-1 text-xs text-[#a68e95]">
                          {member.guardianEmail || "No email"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          className={
                            member.membershipStatus === "eligible"
                              ? "bg-[#e6eee5] text-[#50775d] hover:bg-[#e6eee5]"
                              : "bg-[#f3e7e2] text-[#8d6068] hover:bg-[#f3e7e2]"
                          }
                        >
                          {memberStatus(member.membershipStatus)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {member.cardId ? (
                          <span className="text-xs font-medium text-[#7c3f52]">
                            {member.cardId}
                          </span>
                        ) : (
                          <span className="text-xs text-[#a68e95]">
                            Not issued
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedId(member.id)}
                          className="h-9 rounded-lg border-[#e5d4ce] text-[#7c3f52]"
                        >
                          View profile
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="rounded-2xl border border-[#ecd5c9] bg-[#fff8f4] p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow">No automatic merge</p>
            <h2 className="mt-1 font-serif text-xl text-[#302126]">
              Records requiring staff review ({reviews?.length ?? 0})
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-[#7b666c]">
            Potential matches are based on normalized names and contact
            information. No record changes until a staff member decides.
          </p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {reviews?.map(review => (
            <div key={review.id} className="rounded-xl bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-[#38282e]">
                  {review.memberName}
                </p>
                <Badge
                  variant="outline"
                  className="border-[#e5c6b5] text-[#9d5841]"
                >
                  {review.confidence}%
                </Badge>
              </div>
              <p className="mt-1 text-xs text-[#987f86]">{review.reason}</p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={resolve.isPending}
                  onClick={() =>
                    resolve.mutate({
                      reviewId: review.id,
                      status: "not_duplicate",
                    })
                  }
                >
                  Not a duplicate
                </Button>
                <Button
                  size="sm"
                  disabled={resolve.isPending}
                  className="bg-[#7c3f52]"
                  onClick={() =>
                    resolve.mutate({
                      reviewId: review.id,
                      status: "confirmed_duplicate",
                    })
                  }
                >
                  Confirm for review
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Dialog
        open={Boolean(selectedId)}
        onOpenChange={open => !open && setSelectedId(null)}
      >
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-2xl p-0">
          <DialogHeader className="border-b border-[#eee3df] bg-[#fcf7f4] p-6">
            <DialogTitle className="font-serif text-2xl text-[#302126]">
              {profile?.fullName ?? "Member profile"}
            </DialogTitle>
            <p className="mt-1 text-xs text-[#9a858a]">{profile?.memberCode}</p>
          </DialogHeader>
          {profile ? (
            <div className="space-y-6 p-6">
              <div
                className={`rounded-xl border p-4 ${profile.parentUpdate?.status === "confirmed" ? "border-[#c8dec9] bg-[#f4fbf4]" : "border-[#f1c4c7] bg-[#fff3f3]"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p
                      className={`font-medium ${profile.parentUpdate?.status === "confirmed" ? "text-[#3e6b49]" : "text-[#a33d46]"}`}
                    >
                      {profile.parentUpdate?.status === "confirmed"
                        ? "Confirmed — Policy accepted"
                        : "Pending — Policy acceptance required"}
                    </p>
                    <p className="mt-1 text-xs text-[#846c73]">
                      {profile.parentUpdate?.status === "confirmed" &&
                      profile.policyAcceptance
                        ? `Accepted ${new Date(profile.policyAcceptance.acceptedAt).toLocaleString("en-GB")}`
                        : "Send the secure Parent update link and wait for submission."}
                    </p>
                  </div>
                  {profile.parentUpdate?.status === "confirmed" ? (
                    <CheckCircle2 className="h-6 w-6 text-[#4f7d59]" />
                  ) : (
                    <Badge className="bg-[#a33d46] text-white">Pending</Badge>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Info
                  label="Phone"
                  value={profile.guardianPhone || "Not provided"}
                />
                <Info
                  label="Email"
                  value={profile.guardianEmail || "Not provided"}
                />
                <Info
                  label="Birth date"
                  value={profile.birthDateRaw || "Not provided"}
                />
              </div>
              <div className="rounded-xl border border-[#eaded9] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#3d2b31]">
                      Digital membership card
                    </p>
                    <p className="mt-1 text-xs text-[#927d83]">
                      {profile.cardId ?? "No card has been issued"}
                    </p>
                  </div>
                  {profile.cardId ? (
                    <Badge className="bg-[#e6eee5] text-[#50775d]">
                      Active
                    </Badge>
                  ) : (
                    <Button
                      disabled={issue.isPending}
                      onClick={() => issue.mutate({ memberId: profile.id })}
                      className="rounded-xl bg-[#7c3f52]"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Issue card
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-[#3d2b31]">
                  Class enrolments
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.enrollments.map(item => (
                    <Badge
                      key={item.id}
                      variant="outline"
                      className="border-[#e7d4cc] px-3 py-1.5 text-[#6e5960]"
                    >
                      {item.levelName}
                      {item.scheduleText ? ` · ${item.scheduleText}` : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <Skeleton className="h-40 w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Instant Add Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={qaName}
                onChange={e => setQaName(e.target.value)}
                placeholder="Parent or child name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mobile</label>
              <Input
                value={qaPhone}
                onChange={e => setQaPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setQuickAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => quickAdd.mutate({ name: qaName, phone: qaPhone })}
              disabled={!qaName || !qaPhone || quickAdd.isPending}
              className="bg-[#7c3f52]"
            >
              Add & WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#fcf8f6] p-3">
      <p className="text-[11px] text-[#9a858a]">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-[#453239]">
        {value}
      </p>
    </div>
  );
}
