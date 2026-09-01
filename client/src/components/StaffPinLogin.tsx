import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function StaffPinLogin() {
  const { data: staff = [], isLoading } = trpc.auth.staffOptions.useQuery();
  const login = trpc.auth.pinLogin.useMutation();
  const [selectedName, setSelectedName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await login.mutateAsync({ displayName: selectedName, pin });
      window.location.assign("/");
    } catch {
      setPin("");
      setError("Please check your name and four-digit PIN, then try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf7f3] grid place-items-center px-5 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-[2rem] border border-[#eaded9] bg-white shadow-[0_24px_70px_rgba(62,32,40,0.12)]">
        <div className="bg-[#302126] px-8 py-8 text-[#fffaf7]">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d6a792] text-[#302126]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d6a792]">
            Premier Ballet Academy
          </p>
          <h1 className="mt-2 font-serif text-3xl">Staff Sign In</h1>
          <p className="mt-3 text-sm leading-6 text-[#eaded9]">
            Choose your staff name and enter your personal four-digit PIN.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-5 p-8">
          <div className="space-y-2">
            <Label htmlFor="staff-name">Staff member</Label>
            <select
              id="staff-name"
              value={selectedName}
              onChange={event => setSelectedName(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#eaded9] bg-white px-3 text-sm text-[#302126]"
              required
              disabled={isLoading}
            >
              <option value="">Select your name</option>
              {staff.map(person => (
                <option key={person.id} value={person.displayName}>
                  {person.displayName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-pin">Four-digit PIN</Label>
            <Input
              id="staff-pin"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{4}"
              maxLength={4}
              value={pin}
              onChange={event =>
                setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="••••"
              className="h-12 rounded-xl text-center text-xl tracking-[0.5em]"
              required
            />
          </div>
          {error ? (
            <p className="rounded-xl bg-[#fdf0ed] px-3 py-2 text-sm text-[#9b4f3a]">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={login.isPending || !selectedName || pin.length !== 4}
            className="h-12 w-full rounded-xl bg-[#7c3f52] hover:bg-[#693344]"
          >
            {login.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            <span>Enter staff workspace</span>
          </Button>
          <p className="text-center text-xs leading-5 text-[#8d7b80]">
            Your individual PIN is private. Ask the System Admin if you need it
            reset.
          </p>
        </form>
      </section>
    </div>
  );
}
