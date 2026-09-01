import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, CircleAlert, Link2, UsersRound } from "lucide-react";
import { useLocation } from "wouter";

const money = (cents: number) =>
  new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP" }).format(
    cents / 100
  );

export default function Home() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.dashboard.summary.useQuery();
  const { data: reviews } = trpc.dashboard.duplicateReviews.useQuery();

  const stats = [
    {
      label: "Members",
      value: data?.members,
      note: `${data?.families ?? 0} connected families`,
      icon: UsersRound,
      tone: "bg-[#f4e5dc] text-[#8c5443]",
    },
    {
      label: "Loyalty eligible",
      value: data?.eligibleMembers,
      note: "Can use eligible offers",
      icon: BadgeCheck,
      tone: "bg-[#e6eee5] text-[#50775d]",
    },
    {
      label: "Review required",
      value: data?.duplicateReviews,
      note: "Potential duplicate records",
      icon: CircleAlert,
      tone: "bg-[#f8eadf] text-[#a96330]",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7 fade-up">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#302126] p-7 text-[#fffaf6] md:p-9">
        <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full border border-[#d6a792]/25" />
        <div className="absolute -bottom-24 right-16 h-64 w-64 rounded-full bg-[#7c3f52]/40 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow text-[#e4b9a6]">Staff overview</p>
            <h1 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">
              A calm, clear view of every family.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#eedfda]">
              The protected central database is the source of truth for member
              records, wallet activity, and membership cards. Use Parent Updates
              to send secure policy and profile-confirmation links.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setLocation("/parent-updates")}
              className="h-11 rounded-xl bg-[#d6a792] px-5 text-[#302126] hover:bg-[#e4b9a6]"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Parent updates
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(item => (
          <article key={item.label} className="soft-card rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#6e5960]">
                  {item.label}
                </p>
                {isLoading ? (
                  <Skeleton className="mt-3 h-9 w-24" />
                ) : (
                  <p className="mt-2 font-serif text-3xl text-[#302126]">
                    {item.value ?? 0}
                  </p>
                )}
                <p className="mt-2 text-xs text-[#9a858a]">{item.note}</p>
              </div>
              <div
                className={`grid h-10 w-10 place-items-center rounded-xl ${item.tone}`}
              >
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.42fr_.9fr]">
        <article className="rounded-2xl border border-[#ecd5c9] bg-[#fff8f4] p-6">
          <p className="eyebrow">Data quality</p>
          <h2 className="mt-1 font-serif text-2xl text-[#302126]">
            Potential duplicate review
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#765f65]">
            The system never merges families automatically. Potential matches
            stay visible for staff review and a human decision.
          </p>
          <div className="mt-5 space-y-3">
            {reviews?.slice(0, 3).map(review => (
              <div
                className="rounded-xl bg-white p-3.5 shadow-sm"
                key={review.id}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[#3d2b31]">
                    {review.memberName}
                  </p>
                  <Badge
                    variant="outline"
                    className="border-[#e7c5b5] text-[#9d5841]"
                  >
                    {review.confidence}%
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-[#907a80]">
                  {review.reason}
                </p>
              </div>
            )) ?? <Skeleton className="h-20 w-full" />}
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/members?review=duplicates")}
            className="mt-5 w-full rounded-xl border-[#d9afa0] text-[#7c3f52]"
          >
            Open data review
          </Button>
        </article>
      </section>
    </div>
  );
}
