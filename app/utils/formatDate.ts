// Versatile date utilities
// Supports parsing many common input types and formatting to multiple patterns/locales.

export type DateInput = string | number | Date | null | undefined;

export function isValidDate(d: Date | null): d is Date {
    return !!d && !isNaN(d.getTime());
}

/**
 * Try to coerce various date input shapes into a JS Date object.
 * Supports: Date, numeric timestamp, ISO strings, "YYYY-MM-DD", "DD-MM-YYYY",
 * "DD/MM/YYYY", SQL datetimes with time (T or space), and more.
 */
export function parseDate(input: DateInput): Date | null {
    if (input == null) return null;
    if (input instanceof Date) return isValidDate(input) ? input : null;
    // numbers are timestamps
    if (typeof input === "number") {
        const d = new Date(input);
        return isValidDate(d) ? d : null;
    }

    // strings
    if (typeof input === "string") {
        const s = input.trim();
        if (!s) return null;

        // Try ISO / RFC first
        const iso = new Date(s);
        if (isValidDate(iso)) return iso;

        // Try common patterns: YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY
        const ymd = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})\s*(?:T.*)?$/;
        const dmyDash = /^\s*(\d{1,2})-(\d{1,2})-(\d{4})\s*$/;
        const dmySlash = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/;
        let m;
        if ((m = s.match(ymd))) {
            const [_, yy, mm, dd] = m;
            const d = new Date(Number(yy), Number(mm) - 1, Number(dd));
            return isValidDate(d) ? d : null;
        }
        if ((m = s.match(dmyDash))) {
            const [_, dd, mm, yy] = m;
            const d = new Date(Number(yy), Number(mm) - 1, Number(dd));
            return isValidDate(d) ? d : null;
        }
        if ((m = s.match(dmySlash))) {
            const [_, dd, mm, yy] = m;
            const d = new Date(Number(yy), Number(mm) - 1, Number(dd));
            return isValidDate(d) ? d : null;
        }

        // last attempt: numeric string timestamp
        const asNum = Number(s);
        if (!isNaN(asNum)) {
            const d = new Date(asNum);
            if (isValidDate(d)) return d;
        }
    }

    return null;
}

/**
 * Format tokens supported:
 * YYYY, YY, MMMM, MMM, MM, M, DD, D, hh, h, HH, H, mm, m, ss, s, A (AM/PM)
 */
function pad(n: number, len = 2) {
    return n.toString().padStart(len, "0");
}

export function formatWithPattern(d: Date, pattern: string, locale?: string): string {
    // protect against invalid Date objects (Intl.format will throw RangeError)
    if (!isValidDate(d)) return "";
    // safe values
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const seconds = d.getSeconds();
    const ampm = hours >= 12 ? "PM" : "AM";

    const replacements: Record<string, string> = {
        "YYYY": String(year),
        "YY": String(year).slice(-2),
        "MMMM": new Intl.DateTimeFormat(locale || undefined, { month: "long" }).format(d),
        "MMM": new Intl.DateTimeFormat(locale || undefined, { month: "short" }).format(d),
        "MM": pad(month),
        "M": String(month),
        "DD": pad(date),
        "D": String(date),
        "hh": pad((hours % 12) === 0 ? 12 : hours % 12),
        "h": String((hours % 12) === 0 ? 12 : hours % 12),
        "HH": pad(hours),
        "H": String(hours),
        "mm": pad(minutes),
        "m": String(minutes),
        "ss": pad(seconds),
        "s": String(seconds),
        "A": ampm,
    };

    // Replace tokens using a single regex pass on the original pattern.
    // This avoids replacing letters that appear inside replacement values
    // (e.g. the 'D' in 'Dec') which would happen if we do iterative string replaces.
    const tokens = Object.keys(replacements).sort((a, b) => b.length - a.length);
    // escape tokens for regex (they are letters but keep safe)
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(tokens.map(esc).join("|"), "g");
    const out = pattern.replace(re, (match) => replacements[match] ?? match);
    return out;
}

export type FormatPreset =
    | "system"
    | "iso"
    | "YYYY-MM-DD"
    | "DD-MM-YYYY"
    | "MM/DD/YYYY"
    | "DD MMM YYYY"
    | "short"
    | "medium"
    | "long"
    | "full";

/**
 * Format a date input into one of several presets or a custom pattern.
 * - `pattern` takes precedence when provided and supports tokens (see `formatWithPattern`).
 * - `preset` can be a locale key like "en-GB" (if `useLocaleAsPreset`), or one of the built-in presets.
 */
export function formatDateFlexible(input: DateInput, opts?: { pattern?: string; preset?: FormatPreset | string; locale?: string; useLocaleAsPreset?: boolean; }): string {
    const { pattern, preset, locale, useLocaleAsPreset } = opts || {};
    const d = parseDate(input);
    if (!d) return "";

    if (pattern) {
        return formatWithPattern(d, pattern, locale);
    }

    // If preset is a BCP-47 locale and caller wants locale-based formatting
    if (useLocaleAsPreset && preset && typeof preset === "string") {
        try {
            return new Intl.DateTimeFormat(preset, { year: "numeric", month: "short", day: "2-digit" }).format(d);
        } catch (err) {
            // fall through
        }
    }

    switch (preset) {
        case "iso":
            return d.toISOString();
        case "YYYY-MM-DD":
            return formatWithPattern(d, "YYYY-MM-DD", locale);
        case "DD-MM-YYYY":
            return formatWithPattern(d, "DD-MM-YYYY", locale);
        case "MM/DD/YYYY":
            return formatWithPattern(d, "MM/DD/YYYY", locale);
        case "DD MMM YYYY":
            return formatWithPattern(d, "DD MMM YYYY", locale);
        case "short":
            return new Intl.DateTimeFormat(locale || undefined, { year: "numeric", month: "numeric", day: "numeric" }).format(d);
        case "medium":
            return new Intl.DateTimeFormat(locale || undefined, { year: "numeric", month: "short", day: "2-digit" }).format(d);
        case "long":
            return new Intl.DateTimeFormat(locale || undefined, { year: "numeric", month: "long", day: "2-digit" }).format(d);
        case "full":
            return new Intl.DateTimeFormat(locale || undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(d);
        case "system":
        default:
            // Default to system locale medium representation
            return new Intl.DateTimeFormat(locale || undefined, { year: "numeric", month: "short", day: "2-digit" }).format(d);
    }
}

/**
 * Backward-compatible helper kept for existing callers.
 * Previously accepted an ISO-like string and returned `DD-MM-YYYY`.
 */
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const d = parseDate(dateStr);
    if (!d) return "";
    return formatDateFlexible(d, { preset: "DD-MM-YYYY" });
}

/**
 * Helper to format using a global setting variable.
 * `globalSetting` can be a pattern like "DD-MM-YYYY", a preset (see FormatPreset), or a locale code (e.g. "en-GB").
 */
export function formatBySetting(input: DateInput, globalSetting?: string): string {
    if (!globalSetting) return formatDateFlexible(input, { preset: "system" });
    // if looks like a pattern (contains token letters), use pattern
    if (/[YDMmhHsA]/.test(globalSetting)) {
        return formatDateFlexible(input, { pattern: globalSetting });
    }
    // if looks like a locale (contains '-') or is a recognized preset, try using as locale/preset
    const lower = globalSetting as FormatPreset | string;
    const presets: string[] = ["iso", "YYYY-MM-DD", "DD-MM-YYYY", "MM/DD/YYYY", "DD MMM YYYY", "short", "medium", "long", "full", "system"];
    if (presets.includes(lower)) {
        return formatDateFlexible(input, { preset: lower as FormatPreset });
    }
    // otherwise assume it's a locale
    return formatDateFlexible(input, { preset: "system", locale: globalSetting, useLocaleAsPreset: true });
}

export default {
    parseDate,
    formatWithPattern,
    formatDateFlexible,
    formatDate,
    formatBySetting,
};
