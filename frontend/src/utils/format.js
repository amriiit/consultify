export const dateTime = (value) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export const date = (value) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
export const fee = (value) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
    Number(value),
  );
export const initials = (name) =>
  name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase() || "C";

export const countLabel = (count, noun) =>
  `${Number(count)} ${noun}${Number(count) === 1 ? "" : "s"}`;
