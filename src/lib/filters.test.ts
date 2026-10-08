import { describe, expect, it } from "vitest";
import { filtersToSearch, parseFilters } from "@/lib/filters";

describe("parseFilters", () => {
  it("returns defaults for empty params", () => {
    expect(parseFilters({})).toEqual({ sizes: [], colors: [], sort: "new", page: 1 });
  });

  it("drops invalid values instead of throwing", () => {
    const f = parseFilters({ sort: "hack", page: "-2", min: "abc", max: "-5", size: "" });
    expect(f).toEqual({ sizes: [], colors: [], sort: "new", page: 1 });
  });

  it("swaps min > max and dedupes multi values", () => {
    const f = parseFilters({ min: "500000", max: "100000", size: ["M", "M", "L"], color: "Đen" });
    expect(f.min).toBe(100000);
    expect(f.max).toBe(500000);
    expect(f.sizes).toEqual(["M", "L"]);
    expect(f.colors).toEqual(["Đen"]);
  });

  it("uses route category over query and validates slug", () => {
    expect(parseFilters({ cat: "quan" }, "ao-thun").category).toBe("ao-thun");
    expect(parseFilters({ cat: "../etc" }).category).toBeUndefined();
  });

  it("caps oversized input", () => {
    const f = parseFilters({ size: Array.from({ length: 50 }, (_, i) => `S${i}`) });
    expect(f.sizes.length).toBeLessThanOrEqual(10);
  });
});

describe("filtersToSearch", () => {
  it("omits defaults and round-trips", () => {
    expect(filtersToSearch(parseFilters({}))).toBe("");
    const f = parseFilters({ size: ["L", "M"], sort: "price-asc", page: "2", min: "100000" });
    const qs = filtersToSearch(f);
    expect(qs).toBe("?size=L&size=M&min=100000&sort=price-asc&page=2");
    expect(parseFilters(Object.fromEntries(groupParams(qs)))).toEqual(f);
  });
});

function groupParams(qs: string) {
  const sp = new URLSearchParams(qs);
  return [...new Set(sp.keys())].map((k) => [k, sp.getAll(k)] as const);
}
