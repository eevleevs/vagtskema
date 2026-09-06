import { Temporal } from "@js-temporal/polyfill";
import * as XLSX from "xlsx";
import type { EventAttributes } from "ics";

export const extension = /\.xlsx?$/i;

const months = [
  "januar",
  "februar",
  "marts",
  "april",
  "maj",
  "juni",
  "juli",
  "august",
  "september",
  "oktober",
  "november",
  "december",
];

const ignoredTurns = /^(DATO|FRI|FERIE|BAGBAG)$/i;

export function transformSpreadsheet(
  data: Uint8Array,
  initials: string,
): EventAttributes[] {
  const wb = XLSX.read(data, { type: "array" });
  const csvData = XLSX.utils.sheet_to_csv(wb.Sheets["Ark1"]);
  if (!csvData) throw new Error("Invalid spreadsheet format");
  const rows = csvData.split("\n");

  let m;
  while (rows.length) {
    m = rows.shift()?.match(/(\w+) +(\d+)/);
    if (m) break;
  }
  if (!m) throw new Error("Could not parse month");

  const month = months.indexOf(m[1].toLowerCase()) + 1;
  if (month == 0) throw new Error("Could not parse month");
  const year = parseInt(m[2]);

  const columns = rows.shift()?.split(",") ?? [];
  const dateColumn = columns.indexOf("DATO");
  if (dateColumn == -1) throw new Error("Could not parse columns");

  const pattern = new RegExp(`\\b${initials}\\b`, "i");

  const events: EventAttributes[] = [];
  for (const row of rows) {
    const values = row.split(",");
    const day = parseInt(values[dateColumn]);
    if (isNaN(day)) break;
    let hours = 0;

    let start = Temporal.ZonedDateTime.from({
      timeZone: "Europe/Copenhagen",
      year,
      month,
      day,
      hour: 8,
      minute: 15,
    }).withTimeZone("UTC");

    if ([6, 7].includes(start.dayOfWeek)) {
      start = start.add(Temporal.Duration.from({ minutes: 45 }));
    }

    for (let i = dateColumn; i < columns.length; i++) {
      if (columns[i].match(ignoredTurns)) continue;
      if (!values[i].match(pattern)) continue;
      let minutes = 0;

      switch (columns[i]) {
        case "BA.VA":
          switch (start.dayOfWeek) {
            case 5: // Friday
              hours = 24;
              minutes = 45;
              break;
            case 7: // Sunday
              hours = 23;
              minutes = 15;
              break;
            default:
              hours = 24;
          }
          break;
        case "STUEGANG":
          if (hours > 8) continue;
        default:
          hours = 8;
      }

      events.push({
        start: [start.year, start.month, start.day, start.hour, start.minute],
        startInputType: "utc",
        duration: { hours, minutes },
        title: columns[i],
      });
    }
  }

  return events;
}
