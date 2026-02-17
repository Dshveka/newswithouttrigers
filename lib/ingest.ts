import { dedupeByHash } from "@/lib/dedupe";
import { saveClusteredEvents, saveDigest, saveSourceItems } from "@/lib/digestStore";
import { classifyAndCluster, composeDigest } from "@/lib/openaiPipeline";
import { fetchSourceItems } from "@/lib/sources";

export async function runIngestion() {
  const fetched = await fetchSourceItems(20);
  const uniqueItems = dedupeByHash(fetched);
  const sourceByUrl = new Map(uniqueItems.map((item) => [item.url, item.source]));

  await saveSourceItems(uniqueItems);

  const clusters = await classifyAndCluster(uniqueItems);
  const vitalClusters = clusters.filter((cluster) => {
    if (!cluster.vital_now) return false;
    const sourceNames = new Set(
      cluster.sources.map((url) => sourceByUrl.get(url)).filter((source): source is string => Boolean(source))
    );
    return sourceNames.size >= 2;
  });

  await saveClusteredEvents(vitalClusters);

  const digestText = await composeDigest(vitalClusters);
  const sourceSet = new Set<string>();
  for (const cluster of vitalClusters) {
    for (const source of cluster.sources) {
      sourceSet.add(source);
    }
  }

  const digest = {
    created_at: new Date().toISOString(),
    digest_text: digestText,
    sources: Array.from(sourceSet)
  };

  await saveDigest(digest);

  return {
    fetchedCount: fetched.length,
    uniqueCount: uniqueItems.length,
    vitalClusters: vitalClusters.length,
    digest
  };
}
