---
name: fix-a11y
description: Audit a component or page file for WCAG 2.2 AA violations and output a corrected version with explanations for every change made.
---

# Command: fix-a11y

## Usage
```
/fix-a11y <file-path>
/fix-a11y <file-path> --report-only
```

## Examples
```
/fix-a11y components/ui/DataTable.tsx
/fix-a11y app/dashboard/users/page.tsx --report-only
```

## What AI Will Do

### Step 1 — Read & Analyze
Read the file and check every element against:
- WCAG 2.2 AA success criteria
- ARIA Authoring Practices Guide (APG) patterns
- Dashboard Design System focus/contrast rules

### Step 2 — Report
Output a structured report:
```
AUDIT REPORT: <filename>
──────────────────────────────
[PASS] Color contrast: all text elements ✓
[FAIL] Focus state: 3 interactive elements missing focus ring
[FAIL] Touch target: icon button (16×16px) below 44×44px minimum
[WARN] ARIA: role="button" on <div>, should be <button>
──────────────────────────────
Total: 2 failures, 1 warning
```

### Step 3 — Fix (unless --report-only)
Output the corrected file with inline comments:
```tsx
{/* a11y: changed div[role=button] → native <button> for keyboard support */}
<button
  className="... focus-visible:ring-2 focus-visible:ring-[#0C5CAB]"
  aria-label="Delete user"
>
```

### Step 4 — Summary
List every change made with the WCAG criterion it satisfies:
```
CHANGES MADE:
1. Added focus-visible ring → WCAG 2.4.7 Focus Visible
2. Replaced div[role=button] with <button> → WCAG 4.1.2 Name, Role, Value
3. Added aria-label to icon button → WCAG 2.4.6 Headings and Labels
4. Increased touch target padding → WCAG 2.5.8 Target Size
```

## Constraints
- MUST NOT change visual appearance beyond what's required for a11y
- MUST NOT remove existing functionality
- If `--report-only`, output report only — no code modifications