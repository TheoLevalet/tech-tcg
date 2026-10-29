import { readFile, symlink, writeFile } from "node:fs/promises";
import { defineConfig } from "tsup";

interface Manifest {
  dependencies?: Record<string, string>;
}

async function readManifest(dir: string): Promise<Manifest> {
  return JSON.parse(await readFile(`${dir}/package.json`, "utf8")) as Manifest;
}

// Les packages @tech-tcg/* sont inclus dans le bundle : seules leurs dépendances npm sont déclarées.
async function collectDependencies(dir: string, into: Record<string, string>): Promise<void> {
  for (const [name, version] of Object.entries((await readManifest(dir)).dependencies ?? {})) {
    if (version.startsWith("workspace:")) {
      await collectDependencies(`${dir}/node_modules/${name}`, into);
    } else {
      into[name] = version;
    }
  }
}

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  platform: "node",
  target: "node22",
  clean: true,
  noExternal: [/^@tech-tcg\//],
  async onSuccess() {
    const dependencies: Record<string, string> = {};
    await collectDependencies(".", dependencies);
    const manifest = {
      name: "tech-tcg-api",
      private: true,
      type: "module",
      main: "index.js",
      engines: { node: "22" },
      dependencies,
    };
    await writeFile("dist/package.json", `${JSON.stringify(manifest, null, 2)}\n`);
    // Résolution locale pour les emulators ; node_modules est ignoré par `firebase deploy`.
    await symlink("../node_modules", "dist/node_modules");
  },
});
