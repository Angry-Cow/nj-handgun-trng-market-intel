# Live Handoff System

This folder coordinates between Bolt (the coding agent) and an external model (the planning/testing agent).
The user acts as relay between the two.

## How it works

```
External Model                    User (relay)                    Bolt
     |                                |                             |
     |  Writes plan -->               |                             |
     |                    User pastes plan to Bolt                  |
     |                                |  Reads BUILD_PLAN.md       |
     |                                |  Codes the next section     |
     |                                |  Writes STATUS.md          |
     |                                |  Updates CHANGELOG.md      |
     |                    User copies STATUS.md to external model  |
     |  Reviews status -->            |                             |
     |  Writes next plan/prompt -->   |                             |
     |                    User pastes to Bolt                        |
     ...repeat...
```

## Files

### BUILD_PLAN.md
- **Written by:** External model (user pastes content in)
- **Read by:** Bolt at the start of each work session
- **Purpose:** Contains the active build plan, section-by-section prompts, and acceptance criteria
- **Format:** Structured sections with clear task IDs, descriptions, and done-when criteria

### STATUS.md
- **Written by:** Bolt after completing each section
- **Read by:** External model (user copies content out)
- **Purpose:** Structured report of what was built, what's verified, what's blocked, what's next
- **Format:** Fixed template (see below) so the external model can parse it reliably

### CHANGELOG.md
- **Written by:** Bolt (already exists)
- **Read by:** Both
- **Purpose:** Running history of all changes made

## STATUS.md template

```
## Section: [section name]
### Completed
- [what was built, in plain language]
### Verified
- [X] Build passes
- [X] Feature works (describe how it was tested)
- [ ] Not tested (describe what couldn't be verified and why)
### Blocked / Issues
- [any problems encountered, or "None"]
### Files Changed
- [list of files modified or created]
### Next Up
- [what the plan says comes next, or "Awaiting next prompt from external model"]
```

## Rules for the external model

1. Write plans in BUILD_PLAN.md using clear task IDs and done-when criteria
2. Keep each section scoped so Bolt can complete it in one session
3. After reviewing STATUS.md, either approve and write the next section, or write corrections
4. Don't write code — describe what should be built and what the acceptance criteria are
5. Flag any UX/usability concerns based on the status report and user screenshots

## Rules for Bolt

1. Always read BUILD_PLAN.md before starting work
2. After completing a section, write STATUS.md using the template above
3. Update CHANGELOG.md as usual
4. If a plan is ambiguous, note questions in STATUS.md under "Blocked / Issues"
5. Never skip writing STATUS.md — it's how the external model knows what happened
