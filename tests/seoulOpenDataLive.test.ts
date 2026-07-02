import { describe, expect, it } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { listSeoulCityDataAreas } from "../src/services/areaStatusService.js";
import { SeoulOpenDataClient } from "../src/services/seoulOpenDataClient.js";

const apiKey = process.env.SEOUL_OPEN_DATA_API_KEY;
const describeLive = apiKey ? describe : describe.skip;

describeLive("Seoul Open Data live response inspection", () => {
  it(
    "prints the current payload summary for supported areas",
    async () => {
      const client = new SeoulOpenDataClient({
        apiKey,
        timeoutMs: Number(process.env.SEOUL_OPEN_DATA_TIMEOUT_MS ?? 5000)
      });

      const snapshots = await Promise.all(
        listSeoulCityDataAreas().map(async (area) => ({
          serviceAreaName: area.areaName,
          lookupName: area.providerAreaName,
          snapshot: await client.fetchAreaSnapshot(area)
        }))
      );

      const output = snapshots.map(({ serviceAreaName, lookupName, snapshot }) => ({
        serviceAreaName,
        lookupName,
        providerAreaName: snapshot.providerAreaName,
        providerAreaCode: snapshot.providerAreaCode,
        resultCode: snapshot.resultCode,
        population: snapshot.population,
        roadTraffic: snapshot.roadTraffic,
        weather: snapshot.weather,
        eventCountShown: snapshot.events.length,
        sampleEvents: snapshot.events.slice(0, 3)
      }));
      const outputPath = resolve("tmp/seoul-open-data-live-snapshot.json");

      await mkdir("tmp", { recursive: true });
      await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
      process.stdout.write(`\nLive Seoul Open Data snapshot written to ${outputPath}\n`);

      for (const { snapshot } of snapshots) {
        expect(snapshot.resultCode).toBe("INFO-000");
        expect(snapshot.providerAreaName).toBeTruthy();
      }
    },
    30_000
  );
});
