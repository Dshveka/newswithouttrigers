import { runIngestion } from "@/lib/ingest";

async function main() {
  const result = await runIngestion();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
