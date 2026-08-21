"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

export function RedirectForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<string | void>;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  async function submit(formData: FormData) {
    const path = await action(formData);
    if (typeof path === "string" && path) {
      router.push(path);
      return;
    }
    router.refresh();
  }

  return (
    <form action={submit} className={className}>
      {children}
    </form>
  );
}
