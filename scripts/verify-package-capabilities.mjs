import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { readPackagedCapabilities, webAccessParameters } from "./package-profile-utils.mjs";

const dist = join(process.cwd(), "dist");
const files = await readdir(dist);
const profileManifest = JSON.parse(await readFile(join(dist, "package-capability-profiles.json"), "utf8"));

const profiles = ["core", "maps-broad", "maps-restricted"];
for (const profile of profiles) {
    const archives = files.filter(file => file.endsWith(`-${profile}.pbiviz`));
    if (archives.length !== 1) {
        throw new Error(`Expected one ${profile} PBIVIZ archive, found ${archives.length}.`);
    }
    const archive = join(dist, archives[0]);
    const capabilities = await readPackagedCapabilities(archive);
    const actual = webAccessParameters(capabilities);
    const expected = profileManifest[profile]?.webAccessParameters;
    if (!Array.isArray(expected)) throw new Error(`Missing expected capability profile for ${profile}.`);

    if (profile === "core" && actual !== null) {
        throw new Error("Core package must not contain a WebAccess privilege.");
    }
    if (profile === "maps-broad" && JSON.stringify(actual) !== JSON.stringify(["https://*"])) {
        throw new Error(`Broad Maps WebAccess mismatch: ${JSON.stringify(actual)}.`);
    }
    if (profile === "maps-restricted") {
        if (!Array.isArray(actual) || actual.includes("https://*")) {
            throw new Error(`Restricted Maps package has invalid WebAccess parameters: ${JSON.stringify(actual)}.`);
        }
    }
    if (JSON.stringify(actual ?? []) !== JSON.stringify(expected)) {
        throw new Error(`${profile} packaged WebAccess parameters differ from its build profile.`);
    }
    console.log(`${profile}: ${archives[0]} WebAccess=${JSON.stringify(actual ?? [])}`);
}

console.log("PBIVIZ capability inspection passed for Core, broad Maps, and restricted Maps archives.");
