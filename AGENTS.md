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
