"use client";
import CreateFlockForm from "@/components/create/CreateFlockForm";

export default function PreviewCreate() {
  return <CreateFlockForm loggedIn busy={false} error={null} onLogin={() => {}} onSubmit={(v) => alert(JSON.stringify(v, null, 2))} />;
}
