import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Cloud, Database, Link2, UsersRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SyncCenter() {
  const utils = trpc.useUtils();
  const { data } = trpc.sync.status.useQuery();
  const [localAutoSync, setLocalAutoSync] = useState(
    () => localStorage.getItem("pba-pos-auto-sync") !== "off"
  );
  const setAuto = (value: boolean) => {
    setLocalAutoSync(value);
    localStorage.setItem("pba-pos-auto-sync", value ? "on" : "off");
  };
  const refresh = () => utils.sync.status.invalidate();
  const run = trpc.sync.run.useMutation({ onSuccess: refresh });
  const verify = trpc.sync.verify.useMutation({ onSuccess: refresh });
  const snapshot = trpc.sync.bootstrapMembers.useMutation({
    onSuccess: result => {
      toast.success(
        `${result.memberCount} central member records sent to Google Sheets.`
      );
      refresh();
    },
    onError: error => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 fade-up">
      <section>
        <p className="eyebrow">External sync layer</p>
        <h1 className="section-title mt-1">Sync Centre & Google Sheets</h1>
        <p className="mt-2 text-sm text-[#7b666c]">
          The protected application database remains the source of truth. Google
          Sheets receives a controlled operational mirror through Apps Script
          and cannot write back or replace central records.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Status
          icon={Database}
          title="Central source"
          value="Protected & active"
          tone="green"
        />
        <Status
          icon={Cloud}
          title="Google Sheets"
          value={data?.configured ? "Configured" : "Waiting for Apps Script"}
          tone={data?.configured ? "green" : "amber"}
        />
        <Status
          icon={Link2}
          title="Pending events"
          value={String(
            data?.events.filter(event => event.state !== "synced").length ?? 0
          )}
          tone="rose"
        />
      </section>

      <section className="soft-card rounded-2xl p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-medium text-[#3d2b31]">Automatic POS retry</p>
            <p className="mt-1 text-sm text-[#8f787f]">
              When enabled, this device retries queued Point of Sale operations
              when the internet connection returns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={localAutoSync} onCheckedChange={setAuto} />
            <span className="text-sm font-medium text-[#5c474e]">
              {localAutoSync ? "On" : "Off"}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#eaded9] bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-[#eee3df] p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-serif text-xl text-[#302126]">
              Google Sheets event log
            </p>
            <p className="mt-1 text-xs text-[#9a858a]">
              Use the member snapshot once after updating Apps Script to
              populate the Members tab from the protected central database.
              Future registrations and parent updates are delivered after their
              central record commits.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!data?.configured || !data?.enabled || verify.isPending}
              onClick={() => verify.mutate()}
              className="rounded-xl border-[#dcbdae] text-[#7c3f52]"
            >
              {verify.isPending ? "Verifying…" : "Verify connection"}
            </Button>
            <Button
              variant="outline"
              disabled={
                !data?.configured || !data?.enabled || snapshot.isPending
              }
              onClick={() => snapshot.mutate()}
              className="rounded-xl border-[#dcbdae] text-[#7c3f52]"
            >
              <UsersRound className="mr-2 h-4 w-4" />
              {snapshot.isPending ? "Sending roster…" : "Send member roster"}
            </Button>
            <Button
              disabled={!data?.configured || !data?.enabled || run.isPending}
              onClick={() => run.mutate()}
              className="rounded-xl bg-[#7c3f52]"
            >
              {run.isPending ? "Syncing…" : "Sync now"}
            </Button>
          </div>
        </div>
        <div className="divide-y divide-[#f0e7e3]">
          {data?.events.length ? (
            data.events.map(event => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-[#4a373e]">
                    {event.eventType}
                  </p>
                  <p className="mt-1 text-xs text-[#9a858a]">
                    {event.entityType} #{event.entityId} ·{" "}
                    {new Date(event.createdAt).toLocaleString("en-GB")}
                  </p>
                </div>
                <Badge
                  className={
                    event.state === "synced"
                      ? "bg-[#e6eee5] text-[#50775d]"
                      : event.state === "disabled"
                        ? "bg-[#f2e8e4] text-[#8c626b]"
                        : "bg-[#f8eadf] text-[#a96330]"
                  }
                >
                  {event.state === "disabled"
                    ? "Integration disabled"
                    : event.state}
                </Badge>
              </div>
            ))
          ) : (
            <p className="p-7 text-center text-sm text-[#9a858a]">
              No events have been created yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Status({
  icon: Icon,
  title,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  tone: "green" | "amber" | "rose";
}) {
  const styles = {
    green: "bg-[#e6eee5] text-[#50775d]",
    amber: "bg-[#f8eadf] text-[#a96330]",
    rose: "bg-[#f4e5dc] text-[#8c5443]",
  };
  return (
    <article className="soft-card rounded-2xl p-5">
      <div
        className={`grid h-10 w-10 place-items-center rounded-xl ${styles[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm text-[#8a737a]">{title}</p>
      <p className="mt-1 font-serif text-xl text-[#302126]">{value}</p>
    </article>
  );
}
