![Banner Image](docs/images/genkidama.png)

# ⚡ TakeMyEnergy

## 🔧 Compound Engineering Workflow

This repository utilizes the **Compound Engineering Plugin** for Claude Code to maintain high-quality, continuous development in our Angular application.

## 📦 Installation

If you haven't installed the plugin yet, you can find the installation instructions in the official repository:
[everyinc/compound-engineering-plugin](https://github.com/everyinc/compound-engineering-plugin)

To initialize the plugin in this project, run:

```bash
/ce-setup
```

## 🐳 Running the API with Docker

### Dev mode with Docker Compose (hot-reload)

Make sure you have a `.env` file (copy from `.env.example` and fill in your values):

```bash
cp .env.example .env
```

Then start everything:

```bash
docker compose up
```

This starts MongoDB, installs dependencies, and runs both the API and the Angular frontend with hot-reload.

| Service  | URL                       |
| -------- | ------------------------- |
| Frontend | http://localhost:4200     |
| API      | http://localhost:3000/api |

> A `deps` service runs `npm ci` once into a shared volume, then exits. `api` and `frontend` wait for it to complete before starting. First run takes a few minutes; subsequent starts are fast.

To stop:

```bash
docker compose down
```

To also wipe the `node_modules` volume (e.g. after adding or removing npm packages):

```bash
docker compose down -v && docker compose up
```

> **On Mac/Windows:** if Angular hot-reload doesn't pick up file changes, add `--poll 1000` to the frontend command in `docker-compose.yml` — inotify events can be unreliable over volume mounts on non-Linux hosts.

---

### Build the image

```bash
docker build -t take-my-energy-api .
```

### Run the container

First start MongoDB (already defined in `docker-compose.yml`):

```bash
docker compose up -d mongo
```

Then create a `.env.docker` file from the example (it's gitignored):

```bash
cp .env.example .env.docker
```

Edit `.env.docker` and change `MONGODB_URI` so it points to your host machine instead of `localhost` (which inside a container refers to the container itself):

- **Mac / Windows:** `MONGODB_URI=mongodb://host.docker.internal:27018/take-my-energy`
- **Linux:** `MONGODB_URI=mongodb://172.17.0.1:27018/take-my-energy`

Fill in the remaining values, then run:

```bash
docker run --rm -p 10000:10000 --env-file .env.docker take-my-energy-api
```

The API will be available at `http://localhost:10000/api`.

---

## 🧠 Philosophy

We shift from standard ad-hoc prompting to a structured, agent-driven workflow. We treat coding as a continuous loop where:

- **80% of the effort** 📋 is spent on planning, exploring edge cases, and reviewing.
- **20% of the effort** ⌨️ is spent on execution.

The ultimate goal is that every completed task makes the next one easier by compounding our learnings directly into `.claude/CLAUDE.md`.

---

## 🔄 The Core Development Loop

For every new feature, bug fix, or refactor in this Angular project, strictly follow this sequential workflow instead of asking for direct code generation:

### 1. 🧠 Brainstorming (`/ce-brainstorm`)

Before writing any code, explore the requirements and edge cases. This agent researches the codebase, explores potential pitfalls, and helps align the approach.

```bash
/ce-brainstorm "I want to add a new holistic massage booking component"
```

### 2. 📝 Planning (`/ce-plan`)

Convert the brainstormed ideas into a concrete, step-by-step technical implementation plan.

```bash
/ce-plan "Create an implementation plan based on the recent brainstorm"
```

### 3. ⚙️ Execution (`/ce-work`)

Delegate the actual coding based _strictly_ on the plan generated in the previous step.

```bash
/ce-work "Execute the current plan"
```

### 4. 👀 Code Review (`/ce-code-review`)

Act as an automated reviewer to catch bugs, ensure architectural consistency, and validate that the implementation meets our standards before finalizing.

```bash
/ce-code-review
```

### 5. 📚 Compounding (`/ce-compound`) - ⚠️ CRITICAL STEP

After a task is complete, reflect on the process to capture what worked and what didn't. This command automatically updates our project context so the AI learns our patterns and never makes the same mistake twice.

```bash
/ce-compound
```

> **Note:** ⭐ Never skip the Compounding step! The core value of this workflow relies on the continuous improvement of the agent's context and understanding of this specific repository.
