"use client";

import { demoSocialPosts } from "@/lib/social-demo-data";
import type { SocialMetricSnapshot, SocialPost } from "@/lib/social-types";

const STORAGE_KEY = "el-facto-noticias-social-posts";

export function getSocialPosts(): SocialPost[] {
  if (typeof window === "undefined") return demoSocialPosts;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoSocialPosts));
    return demoSocialPosts;
  }

  try {
    return JSON.parse(raw) as SocialPost[];
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoSocialPosts));
    return demoSocialPosts;
  }
}

export function saveSocialPosts(posts: SocialPost[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function latestMetrics(post: SocialPost): SocialMetricSnapshot {
  return post.metrics[post.metrics.length - 1] ?? {
    capturedAt: post.publishedAt ?? new Date().toISOString(),
    views: 0,
    likes: 0,
    replies: 0,
    reposts: 0,
  };
}

export function interactions(snapshot: SocialMetricSnapshot) {
  return snapshot.likes + snapshot.replies + snapshot.reposts + (snapshot.quotes ?? 0) + (snapshot.shares ?? 0) + (snapshot.saves ?? 0);
}

export function engagementRate(snapshot: SocialMetricSnapshot) {
  if (!snapshot.views) return 0;
  return (interactions(snapshot) / snapshot.views) * 100;
}

export function simulateMetricsSync(posts: SocialPost[]): SocialPost[] {
  const now = new Date().toISOString();
  return posts.map((post) => {
    if (post.status !== "published") return post;
    const current = latestMetrics(post);
    const ageFactor = post.platform === "x" ? 1.08 : 1.035;
    const next: SocialMetricSnapshot = {
      ...current,
      capturedAt: now,
      views: Math.round(current.views * ageFactor + (post.platform === "x" ? 180 : 60)),
      reach: current.reach ? Math.round(current.reach * 1.025 + 24) : undefined,
      likes: Math.round(current.likes * 1.025 + 2),
      replies: Math.round(current.replies * 1.02 + (post.platform === "x" ? 1 : 0)),
      reposts: Math.round(current.reposts * 1.025 + 1),
      quotes: current.quotes !== undefined ? Math.round(current.quotes * 1.02) : undefined,
      shares: current.shares !== undefined ? Math.round(current.shares * 1.025 + 1) : undefined,
      saves: current.saves !== undefined ? Math.round(current.saves * 1.025 + 1) : undefined,
      linkClicks: current.linkClicks !== undefined ? Math.round(current.linkClicks * 1.03 + 2) : undefined,
      profileVisits: current.profileVisits !== undefined ? Math.round(current.profileVisits * 1.02 + 1) : undefined,
      followersGained: current.followersGained !== undefined ? Math.round(current.followersGained * 1.015) : undefined,
    };

    return {
      ...post,
      lastSyncedAt: now,
      metrics: [...post.metrics, next],
      actions: [{ id: crypto.randomUUID(), type: "Métricas sincronizadas", actor: "Sistema", occurredAt: now }, ...post.actions],
    };
  });
}
