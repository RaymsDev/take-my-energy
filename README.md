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
