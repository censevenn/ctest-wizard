import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wand2 } from "lucide-react";

interface Props {
  initialTitle?: string;
  initialText?: string;
  onApply: (title: string, text: string) => void;
}

export function CustomTextEditor({ initialTitle = "", initialText = "", onApply }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Eigener Text
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Füge einen deutschen Text ein. Der erste Satz bleibt vollständig, danach wird jedes zweite Wort gekürzt.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ct-title">Titel</Label>
        <Input
          id="ct-title"
          placeholder="z.B. Mein Übungstext"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ct-text">Deutscher Text</Label>
        <Textarea
          id="ct-text"
          rows={12}
          placeholder="Hier den deutschen Text einfügen…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="font-display text-base leading-relaxed"
        />
      </div>
      <Button
        onClick={() => onApply(title.trim() || "Eigener Text", text.trim())}
        disabled={text.trim().length < 20}
        className="gap-2"
      >
        <Wand2 className="h-4 w-4" />
        C-Test erstellen
      </Button>
    </div>
  );
}
