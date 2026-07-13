import { describe, expect, it } from "vitest";
import { demoStories } from "@/lib/demo-data";
import { demoSocialPosts } from "@/lib/social-demo-data";
import { needsHumanConfirmation, suggestStoryMatches } from "@/lib/social-reconciliation";

describe("social reconciliation", () => {
  it("ranks the related story first for a matching social post", () => {
    const post = demoSocialPosts.find((item) => item.id === "social-x-2");
    expect(post).toBeDefined();

    const matches = suggestStoryMatches(post!, demoStories);
    expect(matches[0]?.storyId).toBe("demo-1");
  });

  it("requires confirmation when confidence is below the automatic threshold", () => {
    expect(needsHumanConfirmation({ storyId: "demo", storyTitle: "Demo", confidence: 0.7, reasons: [] })).toBe(true);
    expect(needsHumanConfirmation({ storyId: "demo", storyTitle: "Demo", confidence: 0.92, reasons: [] })).toBe(false);
  });
});
