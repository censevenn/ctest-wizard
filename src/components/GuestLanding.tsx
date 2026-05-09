import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, KeyRound } from "lucide-react";
import { isValidGuestCode, normalizeGuestCode } from "@/lib/guestProfile";

interface GuestLandingProps {
  onLogin: (code: string) => void;
}

export function GuestLanding({ onLogin }: GuestLandingProps) {
  const [code, setCode] = useState("");
  const valid = isValidGuestCode(code);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valid) onLogin(code);
  };

  const random = () => {
    const c = String(Math.floor(100000 + Math.random() * 900000));
    setCode(c);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">C-Test Wizard</h1>
            <p className="text-xs text-muted-foreground">Studienkolleg-Training auf Deutsch</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Gib deinen 6-stelligen Gast-Code ein. Deine Bibliothek, Punkte und Bestzeiten werden lokal
          unter diesem Code gespeichert.
        </p>

        <label className="block text-xs font-medium text-foreground mb-1.5" htmlFor="guest-code">
          Gast-Code
        </label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="guest-code"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => setCode(normalizeGuestCode(e.target.value))}
            placeholder="123456"
            maxLength={6}
            className="pl-9 text-center tracking-[0.6em] font-mono text-lg"
          />
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button type="submit" disabled={!valid} className="w-full">
            Eintreten
          </Button>
          <Button type="button" variant="ghost" onClick={random} className="w-full text-xs">
            Zufälligen Code erstellen
          </Button>
        </div>
      </form>
    </div>
  );
}
