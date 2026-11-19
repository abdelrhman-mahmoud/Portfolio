import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
async function main() {
  const { seed } = await import("../src/lib/server/seed");
  console.log(
    `Seed complete: ${await seed()} new records. Existing content was preserved.`,
  );
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
