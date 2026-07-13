import { Suspense } from "react";
import { SocialPostDetailQuery } from "@/components/social-post-detail-query";

export default function SocialPostDetailPage() {
  return (
    <Suspense fallback={<div className="card">Cargando seguimiento…</div>}>
      <SocialPostDetailQuery />
    </Suspense>
  );
}
