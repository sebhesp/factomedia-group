import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/utils";
describe("slugify", () => { it("normalizes Spanish titles", () => { expect(slugify("La ciudad abrió vías públicas")) .toBe("la-ciudad-abrio-vias-publicas"); }); });
