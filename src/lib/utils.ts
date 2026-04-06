export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-BE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
