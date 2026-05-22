# Rule: Design System Compliance

## Priority: CRITICAL — Never Violate

Every component and page must conform to the Dashboard Design System. These rules are non-negotiable.

---

## 1. Visual Style
The aesthetic is **modern cloud-platform** (Vercel/Heroku/GitHub inspired):
- Dark theme only — no light mode unless explicitly scoped
- Glass panels with subtle transparency
- Soft shadows, never hard/flat
- Rounded corners, never sharp edges on containers

## 2. Color — Use Tokens, Never Raw Values

| Token | Hex | Usage |
|-------|-----|-------|
| `surface` | `#09090b` | Page background |
| `primary` | `#0C5CAB` | Primary actions, links, highlights |
| `secondary` | `#0a4a8a` | Hover state of primary |
| `success` | `#10b981` | Success badges, positive metrics |
| `warning` | `#f59e0b` | Warning badges, caution states |
| `danger` | `#ef4444` | Destructive actions, error states |
| `text` | `#fafafa` | Primary text |

❌ BAD: `className="bg-blue-600"`
✅ GOOD: `className="bg-[#0C5CAB]"` or via CSS variable `var(--color-primary)`

## 3. Spacing — 8pt Grid Only

Valid spacing values (Tailwind): `1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32`
(= 4px, 6px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px, 128px)

❌ BAD: `p-5` (20px — breaks 8pt grid at some breakpoints when combined)  
✅ GOOD: `p-6` (24px) or `p-4` (16px)

Use `gap-6` between cards, `gap-4` between form fields, `gap-2` between label/input.

## 4. Typography — IBM Plex Sans Only

❌ BAD: Using system fonts, Inter, or Roboto  
✅ GOOD: `font-['IBM_Plex_Sans']` via Tailwind config, already set as default

Scale:
- Display: 32px / 700
- H1: 24px / 600
- H2: 20px / 600
- Body: 16px / 400
- Small: 14px / 400
- Caption: 12px / 400

## 5. Shadows & Panels

Glass panel pattern:
```tsx
className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg shadow-black/20"
```

❌ BAD: `shadow-md` with default Tailwind shadow color on dark surface  
✅ GOOD: `shadow-lg shadow-black/20`

## 6. Interaction States Required
Every interactive element MUST have:
- Default state
- Hover state (brightness/opacity shift)
- Focus-visible state (ring-2 in primary color)
- Disabled state (`opacity-50 cursor-not-allowed`)
- Loading state (spinner or skeleton)

❌ BAD: `<button className="bg-[#0C5CAB]">Save</button>`  
✅ GOOD: `<button className="bg-[#0C5CAB] hover:bg-[#0a4a8a] focus-visible:ring-2 focus-visible:ring-[#0C5CAB] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Save</button>`

## 7. Data States Required
Every data-driven component MUST handle:
- `loading` → skeleton UI (not spinner alone)
- `error` → inline error with message + retry
- `empty` → descriptive empty state with action

❌ BAD: Rendering nothing or null when data is undefined  
✅ GOOD: Explicit conditional rendering for all three states