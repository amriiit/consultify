export const count = (value) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;
// The backend does not specify a currency. Avoid assigning a currency it does not store.
export const fee = (value) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
    count(value),
  );
export const date = (value) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
export const dateTime = (value) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export const initials = (name) =>
  (name || "C")
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
export function formValues(event) {
  return Object.fromEntries(new FormData(event.currentTarget));
}
export function nonblank(values) {
  return Object.values(values).every((value) => String(value).trim());
}
