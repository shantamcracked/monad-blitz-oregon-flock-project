"use client";
// OWNER: Shantam (wiring). Visuals: components/create/CreateFlockForm.tsx (Teammate B).
import { useRouter } from "next/navigation";
import CreateFlockForm from "@/components/create/CreateFlockForm";
import { useFlockActions } from "@/lib/useFlock";

export default function CreatePage() {
  const router = useRouter();
  const a = useFlockActions();
  return (
    <CreateFlockForm
      loggedIn={a.loggedIn}
      busy={a.busy}
      error={a.error}
      onLogin={a.login}
      onSubmit={async (v) => { const id = await a.create(v); if (id) router.push(`/board/${id}`); }}
    />
  );
}
