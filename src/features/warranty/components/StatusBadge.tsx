import type { WarrantyStatus } from "../lib/status";

const STYLES: Record<WarrantyStatus, string> = {
  active: "border-line text-foreground",
  expiring: "border-attention bg-attention-surface text-foreground",
  expired: "border-line bg-surface text-muted",
};

const ICONS: Record<WarrantyStatus, string> = { active: "✓", expiring: "!", expired: "–" };

/** The words carry the meaning; colour and icon only reinforce it (CODING_STANDARDS §7). */
export function StatusBadge({ status, text }: { status: WarrantyStatus; text: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${STYLES[status]}`}>
      <span aria-hidden="true">{ICONS[status]}</span>
      {text}
    </span>
  );
}
