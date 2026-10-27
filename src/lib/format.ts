/** Dates in the admin panel, shown in Nigerian time. */
const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" });
const fmtDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });

export const formatDateTime = (d: Date | string | number | null | undefined) => (d ? fmt.format(new Date(d)) : "—");
export const formatDate = (d: Date | string | number | null | undefined) => (d ? fmtDay.format(new Date(d)) : "—");
