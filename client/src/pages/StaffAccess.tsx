import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  Clock3,
  KeyRound,
  ScrollText,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function StaffAccess() {
  const utils = trpc.useUtils();
  const { data: staff = [], isLoading, error } = trpc.staff.list.useQuery();
  const { data: audit = [] } = trpc.staff.audit.useQuery();
  const create = trpc.staff.create.useMutation({
    onSuccess: () => {
      utils.staff.list.invalidate();
      toast.success("Staff account created.");
    },
  });
  const setActive = trpc.staff.setActive.useMutation({
    onSuccess: () => utils.staff.list.invalidate(),
  });
  const resetPin = trpc.staff.resetPin.useMutation({
    onSuccess: () => toast.success("PIN reset successfully."),
  });
  const remove = trpc.staff.remove.useMutation({
    onSuccess: () => {
      utils.staff.list.invalidate();
      toast.success("Staff account removed.");
    },
  });
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"system_admin" | "reception">("reception");
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [newPin, setNewPin] = useState("");

  if (error)
    return (
      <div className="soft-card rounded-3xl p-7">
        <p className="eyebrow">Restricted</p>
        <h1 className="section-title mt-2">System Admin access is required</h1>
        <p className="mt-3 text-sm text-[#76666b]">
          Only the System Admin PIN session can manage staff access.
        </p>
      </div>
    );

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    await create.mutateAsync({ displayName: name, pin, role });
    setName("");
    setPin("");
    setRole("reception");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <section className="rounded-[2rem] bg-[#302126] p-7 text-[#fffaf7] md:p-9">
        <p className="eyebrow text-[#d6a792]">System Admin</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="font-serif text-4xl">Staff Access</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#eaded9]">
              Create individual PIN access for each receptionist. Disable an
              account immediately when a team member leaves, or reset a PIN
              without seeing the old value.
            </p>
          </div>
          <ShieldCheck className="h-11 w-11 text-[#d6a792]" />
        </div>
      </section>
      <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={createAccount}
          className="soft-card rounded-3xl p-6 space-y-4"
        >
          <div>
            <p className="eyebrow">New account</p>
            <h2 className="section-title mt-1">Add staff member</h2>
          </div>
          <div>
            <Label htmlFor="new-staff-name">Staff name</Label>
            <Input
              id="new-staff-name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-2 h-11 rounded-xl"
              required
            />
          </div>
          <div>
            <Label htmlFor="new-staff-pin">Four-digit PIN</Label>
            <Input
              id="new-staff-pin"
              value={pin}
              onChange={e =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              inputMode="numeric"
              maxLength={4}
              className="mt-2 h-11 rounded-xl text-center tracking-[0.35em]"
              required
            />
          </div>
          <div>
            <Label htmlFor="new-staff-role">Access level</Label>
            <select
              id="new-staff-role"
              value={role}
              onChange={e =>
                setRole(e.target.value as "system_admin" | "reception")
              }
              className="mt-2 h-11 w-full rounded-xl border border-[#eaded9] bg-white px-3 text-sm"
            >
              <option value="reception">Reception staff</option>
              <option value="system_admin">System Admin</option>
            </select>
          </div>
          <Button
            disabled={create.isPending || pin.length !== 4}
            className="h-11 w-full rounded-xl bg-[#7c3f52] hover:bg-[#693344]"
          >
            <UserPlus className="h-4 w-4" />
            Add staff account
          </Button>
        </form>
        <section className="soft-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Active access</p>
              <h2 className="section-title mt-1">Your staff team</h2>
            </div>
            <span className="rounded-full bg-[#f5e5dc] px-3 py-1 text-xs font-semibold text-[#7c3f52]">
              {staff.filter(person => person.active).length} active
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {isLoading ? (
              <p className="text-sm text-[#76666b]">Loading staff accounts…</p>
            ) : (
              staff.map(person => (
                <div
                  key={person.id}
                  className="rounded-2xl border border-[#eaded9] bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#302126]">
                        {person.displayName}
                      </p>
                      <p className="mt-1 text-xs text-[#8d7b80]">
                        {person.role === "system_admin"
                          ? "System Admin"
                          : "Reception staff"}{" "}
                        · {person.active ? "Active" : "Disabled"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setResettingId(person.id);
                          setNewPin("");
                        }}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        Reset PIN
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setActive.mutate({
                            staffId: person.id,
                            active: !person.active,
                          })
                        }
                      >
                        {person.active ? (
                          <>
                            <UserMinus className="h-3.5 w-3.5" />
                            Disable
                          </>
                        ) : (
                          "Enable"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[#9b4f3a] hover:bg-[#fdf0ed]"
                        disabled={remove.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove ${person.displayName}'s staff account? This cannot be undone.`
                            )
                          )
                            remove.mutate({ staffId: person.id });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  {resettingId === person.id ? (
                    <div className="mt-3 flex gap-2">
                      <Input
                        value={newPin}
                        onChange={e =>
                          setNewPin(
                            e.target.value.replace(/\D/g, "").slice(0, 4)
                          )
                        }
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="New PIN"
                        className="h-9 max-w-36"
                      />
                      <Button
                        size="sm"
                        disabled={newPin.length !== 4 || resetPin.isPending}
                        onClick={async () => {
                          await resetPin.mutateAsync({
                            staffId: person.id,
                            pin: newPin,
                          });
                          setResettingId(null);
                        }}
                      >
                        Save PIN
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
      <section className="soft-card rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5e5dc] text-[#7c3f52]">
            <ScrollText className="h-5 w-5" />
          </span>
          <div>
            <p className="eyebrow">Accountability</p>
            <h2 className="section-title mt-1">Recent staff activity</h2>
          </div>
        </div>
        <p className="mt-2 text-sm text-[#76666b]">
          POS transactions, new registrations, and member record updates are
          attributed to the active staff PIN account.
        </p>
        <div className="mt-5 space-y-3">
          {audit.length ? (
            audit.map(item => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eaded9] bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-[#302126]">
                    {item.staffName}{" "}
                    <span className="font-normal text-[#76666b]">
                      · {item.action.replace(".", " ")}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-[#8d7b80]">
                    {item.entityType}
                    {item.entityId ? ` #${item.entityId}` : ""} ·{" "}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fbf7f3] px-2.5 py-1 text-xs text-[#7c3f52]">
                  <Clock3 className="h-3 w-3" />
                  {item.staffRole === "system_admin"
                    ? "System Admin"
                    : "Reception"}
                </span>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-[#fbf7f3] p-4 text-sm text-[#8d7b80]">
              No staff-attributed activity has been recorded yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
