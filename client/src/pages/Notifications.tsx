import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { BellRing, CheckCheck, Plus, Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const categoryLabels: Record<string, string> = {
  member_registered: "Member registration",
  duplicate_review: "Duplicate review",
  pos_transaction: "Point of Sale",
  sync_success: "Sync successful",
  sync_failure: "Sync issue",
};

export default function Notifications() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const { data: alerts } = trpc.notification.list.useQuery();
  const { data: preferences } = trpc.notification.preferences.useQuery();
  const [composerOpen, setComposerOpen] = useState(false);
  const [category, setCategory] = useState<
    | "member_registered"
    | "duplicate_review"
    | "pos_transaction"
    | "sync_success"
    | "sync_failure"
  >("member_registered");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const refresh = () => {
    utils.notification.list.invalidate();
    utils.notification.unreadCount.invalidate();
  };
  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: refresh,
  });
  const markAll = trpc.notification.markAllRead.useMutation({
    onSuccess: refresh,
  });
  const setPreference = trpc.notification.setPreference.useMutation({
    onSuccess: () => utils.notification.preferences.invalidate(),
  });
  const create = trpc.notification.create.useMutation({
    onSuccess: result => {
      if (result.created) toast.success("Notification added to the centre.");
      else
        toast.message(
          "Notification was stored without displaying because its category is off."
        );
      setTitle("");
      setBody("");
      setComposerOpen(false);
      refresh();
    },
  });
  const submit = () => {
    if (!title.trim() || !body.trim())
      return toast.error("Enter a notification title and message.");
    create.mutate({ category, title: title.trim(), body: body.trim() });
  };
  return (
    <div className="mx-auto max-w-6xl space-y-6 fade-up">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Custom staff alerts</p>
          <h1 className="section-title mt-1">Notifications Centre</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#7b666c]">
            Follow registrations, Point of Sale activity, reviews, and sync
            events in one place, or create a custom staff alert.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending || !alerts?.some(item => !item.isRead)}
            className="rounded-xl border-[#dcbdae] text-[#7c3f52]"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
          <Button
            onClick={() => setComposerOpen(!composerOpen)}
            className="rounded-xl bg-[#7c3f52]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Custom alert
          </Button>
        </div>
      </section>
      {composerOpen ? (
        <section className="soft-card rounded-2xl p-6">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-[#7c3f52]" />
            <h2 className="font-serif text-xl text-[#302126]">
              Create staff alert
            </h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <Label>Notification category</Label>
              <Select
                value={category}
                onValueChange={value => setCategory(value as typeof category)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                className="mt-2"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="Example: Saturday workshop reminder"
              />
            </div>
          </div>
          <div className="mt-4">
            <Label>Message</Label>
            <Textarea
              className="mt-2 min-h-24"
              value={body}
              onChange={event => setBody(event.target.value)}
              placeholder="Write a clear message for staff…"
            />
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              onClick={submit}
              disabled={create.isPending}
              className="rounded-xl bg-[#7c3f52]"
            >
              {create.isPending ? "Saving…" : "Add notification"}
            </Button>
          </div>
        </section>
      ) : null}
      <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <article className="overflow-hidden rounded-2xl border border-[#eaded9] bg-white">
          <div className="flex items-center justify-between border-b border-[#eee3df] p-5">
            <div>
              <h2 className="font-serif text-xl text-[#302126]">
                Recent notifications
              </h2>
              <p className="mt-1 text-xs text-[#9a858a]">
                Unread notifications are highlighted.
              </p>
            </div>
            <Badge className="bg-[#f4e5dc] text-[#7c3f52]">
              {alerts?.filter(item => !item.isRead).length ?? 0} unread
            </Badge>
          </div>
          <div className="divide-y divide-[#f0e7e3]">
            {alerts?.length ? (
              alerts.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!item.isRead)
                      markRead.mutate({ notificationId: item.id });
                    if (item.actionPath) setLocation(item.actionPath);
                  }}
                  className={`w-full p-5 text-left transition hover:bg-[#fffaf7] ${item.isRead ? "opacity-65" : "bg-[#fff8f4]"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#3d2b31]">
                          {item.title}
                        </p>
                        {!item.isRead ? (
                          <span className="h-2 w-2 rounded-full bg-[#c77461]" />
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#775f66]">
                        {item.body}
                      </p>
                      <p className="mt-2 text-xs text-[#a18a90]">
                        {new Date(item.createdAt).toLocaleString("en-GB")}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-[#eaded9] text-[#806b71]"
                    >
                      {categoryLabels[item.category]}
                    </Badge>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-10 text-center text-sm text-[#9a858a]">
                No notifications yet. Enabled alerts will appear here.
              </div>
            )}
          </div>
        </article>
        <aside className="soft-card h-fit rounded-2xl p-6">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-[#7c3f52]" />
            <h2 className="font-serif text-xl text-[#302126]">
              Notification preferences
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#8c767c]">
            Turn off a category to stop its automatic in-app alerts. This never
            affects central data or transaction records.
          </p>
          <div className="mt-5 space-y-2">
            {preferences?.map(preference => (
              <div
                key={preference.category}
                className="flex items-center justify-between rounded-xl border border-[#eaded9] bg-white px-3 py-3"
              >
                <span className="text-sm font-medium text-[#4b383f]">
                  {categoryLabels[preference.category] ?? preference.label}
                </span>
                <Switch
                  checked={preference.enabled}
                  onCheckedChange={enabled =>
                    setPreference.mutate({
                      category: preference.category,
                      enabled,
                    })
                  }
                />
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
