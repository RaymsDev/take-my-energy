## Git & Commit Conventions

### Commit Guardrails

- **Commit Trigger:** You MUST execute a `git commit` immediately after completing and verifying a single step/checkbox from the plan. Do not wait for the end of the plan.
- **Format:** You must strictly adhere to the Angular Commit Message Guidelines.
- **Structure:**

```text
  <type>(<scope>): <subject>
  <BLANK LINE>
  <body>
  <BLANK LINE>
  Refs: <current-branch-name>
```

### Angular Commit Rules

#### **Allowed Types (Strictly Enforced):**

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies (npm, gulp, broccoli, etc)
- `ci`: Changes to CI configuration files and scripts

#### **Scope:** Optional, but should specify the module or area of the codebase being changed (e.g., `api`, `ui`, `database`)

#### **Subject Line Constraints:**

- Must use the imperative, present tense: "change" not "changed" nor "changes".
- Do not capitalize the first letter.
- Do not put a period (`.`) at the end.

#### **Body Constraints:**

- Just like the subject, use the imperative, present tense.
- Include the motivation for the change and contrast it with previous behavior.

## Documented Solutions

`docs/solutions/` — documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (`module`, `tags`, `problem_type`). Relevant when implementing or debugging in documented areas.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
