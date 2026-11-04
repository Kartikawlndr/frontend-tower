const WIB_TIME_ZONE = "Asia/Jakarta";

type DateValue = string | Date;

function parseDate(value: DateValue): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function getWibDateParts(value: DateValue) {
  const date = parseDate(value);
  if (!date) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WIB_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  return Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
    ? { year, month, day }
    : null;
}

export function getWibDateKey(value: DateValue) {
  const parts = getWibDateParts(value);
  if (!parts) return "";
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function createWibCalendarDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day, 12));
}

export function formatDateWib(value?: DateValue) {
  if (!value) return "—";
  const date = parseDate(value);
  return date
    ? new Intl.DateTimeFormat("id-ID", {
        timeZone: WIB_TIME_ZONE,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date)
    : "—";
}

export function formatTimeWib(value?: DateValue) {
  if (!value) return "—";
  const date = parseDate(value);
  return date
    ? `${new Intl.DateTimeFormat("id-ID", {
        timeZone: WIB_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).format(date)} WIB`
    : "—";
}

export function formatDateTimeWib(value?: DateValue) {
  if (!value) return "—";
  const date = parseDate(value);
  return date ? `${formatDateWib(date)}, ${formatTimeWib(date)}` : "—";
}
