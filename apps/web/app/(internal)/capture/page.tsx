"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";

interface Note {
  id: string;
  name: string;
  text: string;
  savedAt: string;
}

function storageKey(companyId: string) {
  return `zerpa:offline-notes:${companyId}`;
}

export default function CapturePage() {
  const { company } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!company?.id) return;
    try {
      setNotes(JSON.parse(localStorage.getItem(storageKey(company.id)) || "[]"));
    } catch {
      setNotes([]);
    }
  }, [company?.id]);

  function persist(next: Note[]) {
    if (!company?.id) return;
    setNotes(next);
    localStorage.setItem(storageKey(company.id), JSON.stringify(next));
  }

  return (
    <PageContainer>
      <PageHeader
        title="Capture"
        subtitle={online ? "Saved on this device, then sent when you choose." : "You are offline. This note stays on this device."}
      />
      <form
        className="max-w-lg space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !text.trim()) return;
          persist([{ id: crypto.randomUUID(), name: name.trim(), text: text.trim(), savedAt: new Date().toISOString() }, ...notes]);
          setName("");
          setText("");
          toast.success("Saved on this device");
        }}
      >
        <input className="w-full rounded-[8px] border border-border px-3 py-2" placeholder="Customer or company" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className="w-full rounded-[8px] border border-border px-3 py-2" rows={4} placeholder="What they asked for" value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit">Save on this device</Button>
      </form>
      <ul className="mt-6 space-y-3 max-w-lg">
        {notes.map((note) => (
          <li key={note.id} className="rounded-[12px] border border-border p-3 text-sm">
            <p className="font-semibold">{note.name}</p>
            <p className="mt-1">{note.text}</p>
            <Button
              size="sm"
              className="mt-2"
              variant="outline"
              disabled={!online}
              onClick={async () => {
                try {
                  await apiRequest("/crm/leads", { method: "POST", body: { companyName: note.name, title: "Captured offline", notes: note.text } });
                  persist(notes.filter((row) => row.id !== note.id));
                  toast.success("Saved as a lead");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not save the lead");
                }
              }}
            >
              {online ? "Save as a lead" : "Waiting for a connection"}
            </Button>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
