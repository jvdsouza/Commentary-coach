# Commentary Coach
An AI-assisted application that transforms esports commentary recordings into structured, timestamped coaching feedback.

## Overview

Commentary Coach explores how speech-to-text services and large language models can be combined to analyse unstructured audio and deliver actionable educational feedback.

The project investigates the engineering challenges involved in integrating external AI services, managing transcript data, decomposing large analysis tasks and transforming model responses into useful application-level information.

Engineering Focus

- Integration with external transcription and LLM APIs.
- Processing timestamped, speaker-aware transcript data.
- Decomposition of transcripts into manageable analysis contexts.
- Multi-stage analysis and feedback synthesis.
- Transformation of AI responses into structured application data.
- Presentation of chronological and holistic coaching feedback.
- Reuse of previously generated analyses to reduce redundant processing.

Technical Challenges
- Preserving context across transcript segments.
- Managing information exchanged between multiple AI processing stages.
- Balancing analysis granularity against model context and API costs.
- Maintaining traceability between feedback and the original commentary.
- Handling variability in AI-generated responses.
- Project Status

This project is an exploratory prototype focused on AI integration, application engineering and educational feedback workflows. It is not currently under active development.

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
