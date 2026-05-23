# Skill: shadcn/ui Theming

## Purpose
Override shadcn/ui default (light) theme to match the Dashboard Design System dark theme. Apply tokens globally via CSS variables.

---

## CSS Variable Overrides

In `app/globals.css`:
```css
@layer base {
  :root {
    --background: 240 10% 4%;          /* #09090b */
    --foreground: 0 0% 98%;            /* #fafafa */
    --card: 240 10% 6%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 5%;
    --popover-foreground: 0 0% 98%;
    --primary: 211 85% 37%;            /* #0C5CAB */
    --primary-foreground: 0 0% 98%;
    --secondary: 211 85% 29%;          /* #0a4a8a */
    --secondary-foreground: 0 0% 98%;
    --muted: 240 5% 15%;
    --muted-foreground: 240 5% 65%;
    --accent: 211 85% 37%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 72% 51%;          /* #ef4444 */
    --destructive-foreground: 0 0% 98%;
    --border: 240 5% 15%;
    --input: 240 5% 15%;
    --ring: 211 85% 37%;
    --radius: 0.75rem;                 /* rounded-xl = 12px */
  }
}
```

---

## Component-Level Overrides

### Button
shadcn/ui Button already uses CSS variables. Ensure variants match:
```tsx
// Primary action
<Button className="bg-[#0C5CAB] hover:bg-[#0a4a8a] text-white focus-visible:ring-[#0C5CAB]">
  Save Changes
</Button>

// Destructive
<Button variant="destructive" className="bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 border border-[#ef4444]/20">
  Delete
</Button>

// Ghost (nav items, secondary actions)
<Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
  Cancel
</Button>
```

### Card
```tsx
// Override default white background
<Card className="bg-white/5 border-white/10 shadow-lg shadow-black/20">
  <CardHeader>
    <CardTitle className="text-base font-semibold text-[#fafafa]">Title</CardTitle>
    <CardDescription className="text-white/50">Description</CardDescription>
  </CardHeader>
  <CardContent>{/* ... */}</CardContent>
</Card>
```

### Input / Textarea
```tsx
<Input className="bg-white/5 border-white/10 text-[#fafafa] placeholder:text-white/30 focus-visible:ring-[#0C5CAB] focus-visible:border-[#0C5CAB]" />
```

### Select
```tsx
<SelectTrigger className="bg-white/5 border-white/10 text-[#fafafa] focus:ring-[#0C5CAB]">
<SelectContent className="bg-[#09090b] border-white/10 text-[#fafafa]">
<SelectItem className="focus:bg-white/10 focus:text-[#fafafa]">
```

### Dialog / Sheet
```tsx
<DialogContent className="bg-[#09090b] border-white/10 text-[#fafafa] shadow-2xl shadow-black/50">
```

### Table
```tsx
<TableHeader className="border-b border-white/10">
<TableHead className="text-white/50 text-xs font-medium uppercase tracking-wide">
<TableRow className="border-b border-white/5 hover:bg-white/5 transition-colors">
<TableCell className="text-sm text-[#fafafa]">
```

### Badge
```tsx
// Avoid shadcn default variants — use custom semantic variants
const badgeClass = {
  success: "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20",
  warning: "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20",
  danger:  "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20",
  default: "bg-white/5 text-white/60 border border-white/10",
}
```

---

## Dropdown / Popover Menus
```tsx
<DropdownMenuContent className="bg-[#09090b] border-white/10 shadow-xl shadow-black/40 min-w-[160px]">
<DropdownMenuItem className="text-white/70 hover:text-white focus:text-white focus:bg-white/10 cursor-pointer">
<DropdownMenuSeparator className="bg-white/10" />
```

---

## Tooltip
```tsx
<TooltipContent className="bg-[#0C5CAB] text-white text-xs px-2 py-1 rounded-md border-0 shadow-lg">
```