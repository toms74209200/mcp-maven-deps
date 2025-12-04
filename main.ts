import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "mcp-maven-deps",
  version: "0.1.0",
});

const MAVEN_CENTRAL_SEARCH_URL = "https://search.maven.org/solrsearch/select";
const GRADLE_PLUGIN_PORTAL_URL = "https://plugins.gradle.org/api/1.0/plugins";

type VersionType =
  | "stable"
  | "rc"
  | "snapshot"
  | "alpha"
  | "beta"
  | "milestone";

function detectVersionType(version: string): VersionType {
  const versionLower = version.toLowerCase();

  if (versionLower.includes("-snapshot")) return "snapshot";
  if (versionLower.match(/-rc\d*$|-cr\d*$/)) return "rc";
  if (versionLower.match(/-m\d*$|-milestone/)) return "milestone";
  if (versionLower.includes("-alpha")) return "alpha";
  if (versionLower.includes("-beta")) return "beta";

  return "stable";
}

async function searchDependencies({
  query,
  stableOnly = false,
  limit = 5,
  offset = 0,
}: {
  query: string;
  stableOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const mavenUrl = new URL(MAVEN_CENTRAL_SEARCH_URL);
  mavenUrl.searchParams.set("q", query);
  mavenUrl.searchParams.set("rows", limit.toString());
  mavenUrl.searchParams.set("start", offset.toString());
  mavenUrl.searchParams.set("wt", "json");

  const mavenResponse = await fetch(mavenUrl, {
    headers: {
      "User-Agent": "mcp-maven-deps/0.1.0",
      "Connection": "close",
    },
    signal: (new AbortController()).signal,
  })
    .then((res) => res.ok ? res.json() : null)
    .catch(() => null) as { response?: { docs?: unknown[] } } | null;

  const mavenResults = (mavenResponse?.response?.docs ?? [])
    .filter((doc: unknown) =>
      (doc as { v?: string; latestVersion?: string }).v ||
      (doc as { v?: string; latestVersion?: string }).latestVersion
    )
    .map((doc: unknown) => {
      const d = doc as {
        g: string;
        a: string;
        v?: string;
        latestVersion?: string;
        p?: string;
        timestamp: number;
      };
      const version = d.v || d.latestVersion!;
      const versionType = detectVersionType(version);
      return {
        groupId: d.g,
        artifactId: d.a,
        version,
        type: d.p === "maven-plugin" ? "maven-plugin" : "library",
        versionType,
        timestamp: new Date(d.timestamp).toISOString(),
        repository: "Maven Central",
      };
    })
    .filter((result) => !stableOnly || result.versionType === "stable");

  const results = mavenResults.length > 0 ? mavenResults : await (async () => {
    const gradleUrl = new URL(GRADLE_PLUGIN_PORTAL_URL);
    gradleUrl.searchParams.set("q", query);
    gradleUrl.searchParams.set("limit", limit.toString());
    gradleUrl.searchParams.set("offset", offset.toString());

    const gradleResponse = await fetch(gradleUrl, {
      headers: {
        "User-Agent": "mcp-maven-deps/0.1.0",
        "Connection": "close",
      },
      signal: (new AbortController()).signal,
    })
      .then((res) => res.json())
      .catch(() => null) as { plugins?: unknown[] } | null;

    return (gradleResponse?.plugins ?? [])
      .map((plugin: unknown) => {
        const p = plugin as {
          id: string;
          version: string;
          date?: string;
          description?: string;
        };
        const versionType = detectVersionType(p.version);
        return {
          groupId: p.id.split(".").slice(0, -1).join("."),
          artifactId: p.id.split(".").slice(-1)[0],
          version: p.version,
          type: "gradle-plugin" as const,
          versionType,
          timestamp: p.date || new Date().toISOString(),
          description: p.description,
          repository: "Gradle Plugin Portal",
        };
      })
      .filter((result) => !stableOnly || result.versionType === "stable");
  })();

  const paginatedResults = results.slice(offset, offset + limit);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            results: paginatedResults,
            totalCount: results.length,
          },
          null,
          2,
        ),
      },
    ],
  };
}

server.registerTool(
  "search_dependencies",
  {
    title: "Search Dependencies",
    description:
      "Search for Maven and Gradle dependencies across Maven Central and Gradle Plugin Portal",
    inputSchema: z.object({
      query: z.string().describe(
        "Search keywords (artifact name, group name, etc.)",
      ),
      stableOnly: z.boolean().optional().default(false).describe(
        "Filter to stable versions only",
      ),
      limit: z.number().optional().default(5).describe(
        "Number of results per page",
      ),
      offset: z.number().optional().default(0).describe("Pagination offset"),
    }),
  },
  searchDependencies,
);

const transport = new StdioServerTransport();
await server.connect(transport);
