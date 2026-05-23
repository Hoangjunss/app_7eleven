# Rule: Color Tokens

## Priority: CRITICAL — Never Use Raw Color Values

All colors must come from the design system token table. No arbitrary hex, no default Tailwind color palette (except white/black with opacity modifiers).

---

## Token Reference

### Semantic Colors

| Token Name | Hex Value | Tailwind Usage | When to Use |
|-----------|-----------|---------------|-------------|
| `surface` | `#09090b` | `bg-[#09090b]` | Page background |
| `primary` | `#0C5CAB` | `bg-[#0C5CAB]` | Primary buttons, active nav, key highlights |
| `secondary` | `#0a4a8a` | `bg-[#0a4a8a]` | Hover state of primary, secondary panels |
| `success` | `#10b981` | `bg-[#10b981]` / `text-[#10b981]` | Success status, positive delta, complete badge |
| `warning` | `#f59e0b` | `bg-[#f59e0b]` / `text-[#f59e0b]` | Warning status, caution alerts |
| `danger` | `#ef4444` | `bg-[#ef4444]` / `text-[#ef4444]` | Error state, destructive action, negative delta |
| `text` | `#fafafa` | `text-[#fafafa]` | Primary body text |

### Opacity Modifiers (white on dark surface)

| Usage | Class | Approx Contrast |
|-------|-------|----------------|
| Primary text | `text-white` or `text-[#fafafa]` | ~19:1 ✓ |
| Secondary text | `text-white/70` | ~12:1 ✓ |
| Muted text | `text-white/50` | ~8:1 ✓ |
| Disabled / placeholder | `text-white/30` | ~4:1 ✓ (borderline) |
| Decorative only | `text-white/15` | ~2:1 ✗ (NOT for readable text) |
| Panel background | `bg-white/5` | — (glass effect) |
| Panel border | `border-white/10` | — |
| Subtle hover | `hover:bg-white/10` | — |

### Status Badge Colors

```tsx
// Always use these exact combinations
const badgeVariants = {
  success: "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20",
  warning: "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20",
  danger:  "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20",
  default: "bg-white/5 text-white/70 border border-white/10",
}
```

## CSS Variables (tailwind.config.ts)

Define in config for reuse:
```ts
theme: {
  extend: {
    colors: {
      surface:   "#09090b",
      primary:   "#0C5CAB",
      secondary: "#0a4a8a",
      success:   "#10b981",
      warning:   "#f59e0b",
      danger:    "#ef4444",
    }
  }
}
```
Then use: `bg-surface`, `bg-primary`, `text-danger`

## Forbidden Patterns

❌ Raw Tailwind palette colors (unless opacity-modified white/black):
```tsx
// NEVER
bg-blue-600, bg-blue-700, bg-green-500, bg-red-500, bg-yellow-500
text-blue-400, text-gray-400
```

❌ Inline hex without design token alignment:
```tsx
// NEVER
style={{ backgroundColor: "#1e40af" }}
className="bg-[#1e40af]"  // not in token table
```

✅ Always:
```tsx
className="bg-[#0C5CAB]"        // primary token
className="bg-primary"           // if CSS var configured
className="text-[#10b981]"      // success token
className="border-white/10"     // opacity modifier
```

## Gradient Usage

Primary gradient (hero, CTA areas):
```tsx
className="bg-gradient-to-br from-[#0C5CAB] to-[#0a4a8a]"
```

Subtle surface gradient (panels, cards):
```tsx
className="bg-gradient-to-b from-white/5 to-transparent"
```

❌ NEVER: Purple gradients, pink accents, or any color outside the token table.