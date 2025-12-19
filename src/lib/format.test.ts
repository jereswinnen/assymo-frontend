import { describe, test, expect } from "vitest";
import { formatFileSize, formatDateShort, formatDateWithTime } from "./format";

describe("formatFileSize", () => {
  test("formats bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(1023)).toBe("1023 B");
  });

  test("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(10240)).toBe("10.0 KB");
  });

  test("formats megabytes", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
    expect(formatFileSize(10 * 1024 * 1024)).toBe("10.0 MB");
  });

  test("formats gigabytes", () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1.0 GB");
    expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
  });

  test("handles negative values", () => {
    expect(formatFileSize(-1)).toBe("0 B");
    expect(formatFileSize(-1000)).toBe("0 B");
  });
});

describe("formatDateShort", () => {
  test("formats date in Dutch short format", () => {
    // Note: exact output depends on Node locale data
    const result = formatDateShort("2025-01-15T10:00:00Z");
    expect(result).toContain("15");
    expect(result).toContain("2025");
  });

  test("handles different date strings", () => {
    const result1 = formatDateShort("2024-12-25");
    expect(result1).toContain("25");
    expect(result1).toContain("2024");

    const result2 = formatDateShort("2023-06-01T00:00:00.000Z");
    expect(result2).toContain("2023");
  });
});

describe("formatDateWithTime", () => {
  test("formats date with time in Dutch format", () => {
    const result = formatDateWithTime("2025-01-15T14:30:00Z");
    expect(result).toContain("15");
    expect(result).toContain("2025");
    // Time component should be present (format varies by timezone)
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  test("handles midnight", () => {
    const result = formatDateWithTime("2025-06-01T00:00:00Z");
    expect(result).toContain("2025");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});
