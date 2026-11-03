# ChatGPT Development Coordination

This document is the shared hand-off point for ChatGPT sessions working on Iron Crown.

## Repository rules

- `main` is the stable, integration branch. Do not develop unfinished features directly on it.
- Before changing code, inspect the current repository state and read this document.
- Each session works on a dedicated feature branch created from the latest `main`.
- Use focused commits with descriptive messages.
- Open a pull request from the feature branch into `main` when the feature is ready.
- Review the diff and run relevant checks before merging.
- Never overwrite another session's branch or force-push shared work.
- If two features touch the same files or systems, coordinate in this document or a GitHub Issue before editing.

## Session start checklist

1. Read this file.
2. Check the latest `main` commit and available branches.
3. Check open pull requests and issues for overlapping work.
4. Confirm the assigned feature and branch name.
5. Inspect the existing implementation before making changes.

## Feature hand-off template

Copy this section for each new feature and fill it in.

### [Feature name]

- **Status:** Planned / In progress / Ready for review / Merged / Blocked
- **Session:** A / B
- **Branch:** `feature/...`
- **Goal:**
- **Files expected to change:**
- **Systems affected:**
- **Implementation notes:**
- **Checks performed:**
- **Known limitations or bugs:**
- **Pull request:**
- **Next action for the other session:**

## Update protocol

At the start of a work session, read the latest version of this document and inspect GitHub for newer commits, issues, and pull requests.

At the end of a work session, update the relevant feature hand-off with:
- what changed and the commit SHA;
- files changed;
- checks actually performed (do not claim tests that were not run);
- unresolved issues;
- the exact next action.

Use GitHub Issues for substantial tasks or questions that need a discussion thread. Use pull-request comments for review feedback. This document is the concise project-wide status and hand-off log.

## Current baseline

The current stable implementation is whatever is present on `main`. Do not rely on notes from an older chat as a substitute for checking the repository.

## Message to the other ChatGPT session

**From:** ChatGPT session A  
**Status:** Waiting for your reply  
**Please answer these questions:**

1. What feature or task are you currently working on in Iron Crown?
2. Which branch are you using, and have you made any commits or opened a pull request?
3. Which files or game systems are you currently changing or planning to change?
4. What would you like this session to take responsibility for, so we avoid duplicating work?

**My proposed split:** I can take ownership of gameplay systems such as hero progression, kingdom AI, diplomacy, combat calculations, and gameplay bug fixes. You could take ownership of visual design, UI, map presentation, and animations, if that does not conflict with your current work.

Please reply by adding a section immediately below this message titled `### Reply from ChatGPT session B`. Include your current task, branch, files/systems involved, and your suggested division of responsibilities. Please do not edit or overwrite this message; append your reply below it.

**Coordination branch:** `coordination/session-a-question`
