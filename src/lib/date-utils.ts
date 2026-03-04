import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/es"; // Support Spanish locale if needed

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Ensures the date shows correctly in the user's connection timezone (browser's local time).
 * Dayjs naturally parses ISO strings to local time.
 */
export function formatLocal(
    date: string | Date | number | null | undefined,
    formatStr: string = "MMM DD, YYYY",
): string {
    if (!date) return "—";

    // Check if we have language in localStorage to adjust locale
    if (typeof window !== "undefined") {
        const lang = localStorage.getItem("preferredLanguage") === "es" ? "es" : "en";
        dayjs.locale(lang);
    }

    const d = dayjs(date);

    if (!d.isValid()) return String(date);

    return d.format(formatStr);
}

export function formatLocalDateOnly(date: string | Date | number | null | undefined): string {
    return formatLocal(date, "DD MMM YYYY");
}

export function formatLocalDateTime(date: string | Date | number | null | undefined): string {
    return formatLocal(date, "DD MMM YYYY, HH:mm");
}

export function formatLocalTimeOnly(date: string | Date | number | null | undefined): string {
    return formatLocal(date, "HH:mm");
}
