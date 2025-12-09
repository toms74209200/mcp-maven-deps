# mcp-maven-deps

[![JSR](https://jsr.io/badges/@toms/mcp-maven-deps)](https://jsr.io/@toms/mcp-maven-deps)
![GitHub tag (with filter)](https://img.shields.io/github/v/tag/toms74209200/mcp-maven-deps)

Model Context Protocol(MCP) server for searching Maven and Gradle dependencies.

## Requirements

- [Deno](https://deno.land/) 2.0.0 or later

## Usage

### Using Deno

To use it from Deno, you need the network permission.

```bash
deno run --allow-net jsr:@toms/mcp-maven-deps
```

To use it from MCP client, you need to set up the server configuration below.

For Visual Studio Code:

**`mcp.json`**

```json
{
  "servers": {
    "maven-deps": {
      "type": "stdio",
      "command": "deno",
      "args": [
        "run",
        "--allow-net",
        "jsr:@toms/mcp-maven-deps"
      ]
    }
  }
}
```

### Using Pre-built Binary (Linux)

If you want to use mcp-maven-deps as a single binary without installing Deno:

```bash
ARCH=$(uname -m) && \
case "$ARCH" in
    x86_64) BINARY="mcp-maven-deps-x86_64-unknown-linux-gnu";;
    aarch64|arm64) BINARY="mcp-maven-deps-aarch64-unknown-linux-gnu";;
    *) echo "Unsupported architecture: $ARCH"; exit 1;;
esac && \
VERSION=$(curl -s https://api.github.com/repos/toms74209200/mcp-maven-deps/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/') && \
sudo mkdir -p /opt/mcp-maven-deps && \
sudo curl -L -o /opt/mcp-maven-deps/mcp-maven-deps "https://github.com/toms74209200/mcp-maven-deps/releases/download/${VERSION}/${BINARY}" && \
sudo chmod +x /opt/mcp-maven-deps/mcp-maven-deps && \
sudo ln -sf /opt/mcp-maven-deps/mcp-maven-deps /usr/local/bin/mcp-maven-deps
```

**`mcp.json`**

```json
{
  "servers": {
    "maven-deps": {
      "type": "stdio",
      "command": "mcp-maven-deps"
    }
  }
}
```

## Features

- Search dependencies across Maven Central and Gradle Plugin Portal
- Detect version types (stable, rc, snapshot, alpha, beta, milestone)
- Filter to stable versions only
- Pagination support

## Development

- [Deno](https://deno.com/)
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- [zod](https://github.com/colinhacks/zod)

## License

[MIT License](LICENSE)

## Author

[toms74209200](<https://github.com/toms74209200>)
