import type { StoryStatus } from "@/lib/types";

const labels: Record<StoryStatus, string> = {
  draft: "Borrador",
  developing: "En desarrollo",
  waiting_information: "Falta información",
  verification: "En verificación",
  review: "En revisión",
  approved: "Aprobada",
  scheduled: "Programada",
  published: "Publicada",
  updated: "Actualizada",
  corrected: "Corregida",
  archived: "Archivada",
  discarded: "Descartada",
};

export function StatusBadge({ status }: { status: StoryStatus }) {
  return <span className={`status status-${status}`}>{labels[status]}</span>;
}
