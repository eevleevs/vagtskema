import { expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { extension, transformSpreadsheet } from "../src/lib/vagtplan";

const files = readdirSync("tests").filter(
  (name) => !name.startsWith("~$") && extension.test(name),
);

for (const name of files) {
  it(name, () => {
    const data = new Uint8Array(readFileSync(`tests/${name}`));
    const expected = JSON.parse(
      readFileSync(`tests/${name.replace(extension, ".json")}`, "utf8"),
    );
    expect(transformSpreadsheet(data, "SG")).toEqual(expected);
  });
}