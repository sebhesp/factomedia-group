"use client";

import { useSearchParams } from "next/navigation";
import { SocialPostDetail } from "@/components/social-post-detail";

export function SocialPostDetailQuery() {
  const params = useSearchParams();
  return <SocialPostDetail postId={params.get("id") ?? ""} />;
}
