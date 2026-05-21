# Commentary Coach

## Prerequisites

- [Node.js](https://nodejs.org) v22+
- [pnpm](https://pnpm.io) v10+

## Install

From the repository root:

```bash
pnpm install
```

This installs dependencies for all packages (`backend`, `frontend`, `shared`) in one step.

## Environment variables

Copy the sample files and fill in your API keys:

```bash
cp backend/.env.sample backend/.env
cp frontend/.env.sample frontend/.env
```

`backend/.env`:

```
ASSEMBLYAI_API_KEY=   # https://www.assemblyai.com
OPENAI_API_KEY=       # https://platform.openai.com
```

## Dev

```bash
pnpm dev               # starts both backend and frontend
```

For individual services or other commands, use the helper script:

```bash
node run.js            # show available targets and commands
node run.js backend dev
node run.js frontend dev
node run.js backend dev:docker
```

## Test

```bash
pnpm --filter backend test
```
