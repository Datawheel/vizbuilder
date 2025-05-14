import { formatAbbreviate } from "d3plus-format";

export function abbreviate(n, locale) {
  return formatAbbreviate(n, `${locale}-SA`);
}

export function SAR(n, locale) {
  const sar = locale === "en" ? "SAR" : "ريال سعودي";
  const numberSar =
    locale === "en"
      ? `${sar} ${formatAbbreviate(n, `${locale}-SA`)}`
      : `${formatAbbreviate(n, `${locale}-SA`)} ${sar}`;
  if (typeof n === "number")
    return numberSar
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  return sar;
}

export function Dollar(n, locale) {
  let d = n;
  if (typeof n === "number") d = abbreviate(n);
  return locale === "en"
    ? d.charAt(0) === "-"
      ? d.replace("-", "-$")
      : `$${n}`
    : d.charAt(0) === "-"
      ? d.replace("-", "-$")
      : `${d}$`;
}

export function percentage(n, locale) {
  return n < 0
    ? locale === "en"
      ? `${abbreviate(n)}%`
      : `${abbreviate(Math.abs(n))}-%`
    : locale === "en"
      ? `${abbreviate(n)}%`
      : `${abbreviate(n)}%`;
}

export function chartPct(n, locale) {
  if (n === null) return "NaN";
  const formatted = n.toFixed(2);
  return n < 0
    ? locale === "en"
      ? `${formatted}%`
      : `${Math.abs(formatted)}-%`
    : locale === "en"
      ? `${formatted}%`
      : `%${formatted}`;
}

export function tons(n, locale) {
  return locale === "en" ? `${abbreviate(n)} TONS` : `أطنان ${abbreviate(n)}`;
}

export function unit(n) {
  // Check for null value
  if (n === null) return "N/A"; // Return a placeholder for null values
  return Number(n.toFixed(2)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function unitInt(n) {
  return Number(n.toFixed(2)).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function kwh(n, locale) {
  return locale === "en" ? `${abbreviate(n)} KWh` : `كيلوواط ${abbreviate(n)}`;
}

export function degreeCelcius(n, locale) {
  return locale === "en" ? `${abbreviate(n)}°C` : `${abbreviate(n)}°C`;
}

export function cubicMeter(n, locale) {
  return locale === "en" ? `${abbreviate(n)} m³` : `${abbreviate(n)} م³`;
}

export function thousand(n, locale) {
  return locale === "en" ? `${abbreviate(n)} Thousand` : `${abbreviate(n)} ألف`;
}

export function nights(n, locale) {
  return locale === "en" ? `${abbreviate(n)} Nights` : `${abbreviate(n)} ليالي`;
}

export function overnightStays(n, locale) {
  return locale === "en"
    ? `${abbreviate(n * 1e3)} Overnight Stays`
    : `${abbreviate(n * 1e3)} ليلة`;
}

export function tourists(n, locale) {
  return locale === "en"
    ? `${abbreviate(n * 1e3)} Tourists`
    : `${abbreviate(n * 1e3)} سائح`;
}
