import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2019",
  outDir: "dist",
  outExtension({ format }) {
    if (format === "cjs") {
      return { js: ".cjs" };
    }
    return { js: ".esm.js" };
  }
});


