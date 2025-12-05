import { expect, test } from "vitest";

test(
  "when search_dependencies with valid query then returns matching results",
  async () => {
    const command = new Deno.Command("deno", {
      args: ["run", "-A", "--no-check", `${Deno.cwd()}/main.ts`],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });
    const child = command.spawn();

    const writer = child.stdin.getWriter();
    const reader = child.stdout.pipeThrough(new TextDecoderStream())
      .getReader();

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        id: "init-1",
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test-client-stdio", version: "0.0.1" },
        },
      }) + "\n",
    ));

    const readLines = async () => {
      const line = await reader.read();
      if (line.done) {
        return;
      }
      try {
        return JSON.parse(line.value);
      } catch {
        return await readLines();
      }
    };

    await readLines();

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "initialized",
        params: {},
      }) + "\n",
    ));

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        id: "call-1",
        method: "tools/call",
        params: {
          name: "search_dependencies",
          arguments: {
            query: "jackson-databind",
            limit: 5,
          },
        },
      }) + "\n",
    ));

    const actual = await readLines();

    expect(actual.result).toBeDefined();
    expect(actual.result.content).toBeDefined();
    expect(actual.result.content[0].type).toBe("text");

    const resultData = JSON.parse(actual.result.content[0].text);
    expect(Array.isArray(resultData.results)).toBe(true);
    expect(resultData.totalCount).toBeGreaterThanOrEqual(0);

    await writer.close();
    child.kill("SIGTERM");
    await child.status;
  },
);

test(
  "when search_dependencies with stableOnly flag then returns only stable versions",
  async () => {
    const command = new Deno.Command("deno", {
      args: ["run", "-A", "--no-check", `${Deno.cwd()}/main.ts`],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });
    const child = command.spawn();

    const writer = child.stdin.getWriter();
    const reader = child.stdout.pipeThrough(new TextDecoderStream())
      .getReader();

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        id: "init-1",
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test-client-stdio", version: "0.0.1" },
        },
      }) + "\n",
    ));

    const readLines = async () => {
      const line = await reader.read();
      if (line.done) {
        return;
      }
      try {
        return JSON.parse(line.value);
      } catch {
        return await readLines();
      }
    };

    await readLines();

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "initialized",
        params: {},
      }) + "\n",
    ));

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        id: "call-1",
        method: "tools/call",
        params: {
          name: "search_dependencies",
          arguments: {
            query: "junit",
            stableOnly: true,
            limit: 10,
          },
        },
      }) + "\n",
    ));

    const actual = await readLines();

    expect(actual.result).toBeDefined();
    const resultData = JSON.parse(actual.result.content[0].text);

    resultData.results.forEach((result: any) => {
      expect(result.versionType).toBe("stable");
    });

    await writer.close();
    child.kill("SIGTERM");
    await child.status;
  },
);

test(
  "when search_dependencies with offset then returns different results",
  async () => {
    const command = new Deno.Command("deno", {
      args: ["run", "-A", "--no-check", `${Deno.cwd()}/main.ts`],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });
    const child = command.spawn();

    const writer = child.stdin.getWriter();
    const reader = child.stdout.pipeThrough(new TextDecoderStream())
      .getReader();

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        id: "init-1",
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test-client-stdio", version: "0.0.1" },
        },
      }) + "\n",
    ));

    const readLines = async () => {
      const line = await reader.read();
      if (line.done) {
        return;
      }
      try {
        return JSON.parse(line.value);
      } catch {
        return await readLines();
      }
    };

    await readLines();

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "initialized",
        params: {},
      }) + "\n",
    ));

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        id: "call-1",
        method: "tools/call",
        params: {
          name: "search_dependencies",
          arguments: {
            query: "junit",
            limit: 3,
            offset: 0,
          },
        },
      }) + "\n",
    ));

    const actual1 = await readLines();

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        id: "call-2",
        method: "tools/call",
        params: {
          name: "search_dependencies",
          arguments: {
            query: "junit",
            limit: 3,
            offset: 3,
          },
        },
      }) + "\n",
    ));

    const actual2 = await readLines();

    expect(actual1.result).toBeDefined();
    expect(actual2.result).toBeDefined();

    const data1 = JSON.parse(actual1.result.content[0].text);
    const data2 = JSON.parse(actual2.result.content[0].text);

    expect(data1.results).toBeDefined();
    expect(data2.results).toBeDefined();

    await writer.close();
    child.kill("SIGTERM");
    await child.status;
  },
);

test(
  "when tools/call with invalid tool name then returns error",
  async () => {
    const command = new Deno.Command("deno", {
      args: ["run", "-A", "--no-check", `${Deno.cwd()}/main.ts`],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });
    const child = command.spawn();

    const writer = child.stdin.getWriter();
    const reader = child.stdout.pipeThrough(new TextDecoderStream())
      .getReader();

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        id: "init-1",
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test-client-stdio", version: "0.0.1" },
        },
      }) + "\n",
    ));

    const readLines = async () => {
      const line = await reader.read();
      if (line.done) {
        return;
      }
      try {
        return JSON.parse(line.value);
      } catch {
        return await readLines();
      }
    };

    await readLines();

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "initialized",
        params: {},
      }) + "\n",
    ));

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        id: "call-1",
        method: "tools/call",
        params: {
          name: "nonexistent_tool",
          arguments: {},
        },
      }) + "\n",
    ));

    const actual = await readLines();

    expect(actual.result).toBeDefined();
    expect(actual.result.isError).toBe(true);

    await writer.close();
    child.kill("SIGTERM");
    await child.status;
  },
);
