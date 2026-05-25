# medicine-api

This is a REST API that provides a list of medicines.

## Getting Started

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## Environment

Set `CORS_ALLOWED_ORIGINS` to a comma-separated list of frontend origins that may call the API from the browser.

Behavior:

- In non-production, if `CORS_ALLOWED_ORIGINS` is unset, all origins are allowed for local development.
- In production, if `CORS_ALLOWED_ORIGINS` is unset, cross-origin browser requests are blocked.

Example:

```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-app.example.com
```

This project was created using `bun init` in bun v1.3.1. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
