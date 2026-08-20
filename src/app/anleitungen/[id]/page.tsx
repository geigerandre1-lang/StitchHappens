import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowAlong } from "@/components/FollowAlong";
import { getPattern } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PatternPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pattern = await getPattern(id);
  if (!pattern) notFound();

  return (
    <div>
      <Link href="/" className="text-sm text-[#7a6e62] hover:text-[#2c241c]">
        ← Alle Anleitungen
      </Link>
      <div className="mt-4">
        <FollowAlong pattern={pattern} />
      </div>
    </div>
  );
}
