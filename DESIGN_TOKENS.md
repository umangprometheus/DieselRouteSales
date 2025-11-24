# MSP Field Service App - Design Tokens

Complete reference guide for all design tokens used in the MSP Diesel Field Sales Route application.

---

## Color System

### Light Mode Colors

#### Base Colors
```css
--background: 0 0% 98%           /* Main background - Off-white */
--foreground: 220 15% 15%        /* Main text color - Dark gray */
--border: 220 13% 88%            /* Default borders */
```

#### Card Colors
```css
--card: 0 0% 96%                 /* Card background - Light gray */
--card-foreground: 220 15% 15%   /* Card text */
--card-border: 220 13% 91%       /* Card borders (subtle) */
```

#### Sidebar Colors
```css
--sidebar: 0 0% 94%                      /* Sidebar background */
--sidebar-foreground: 220 15% 15%        /* Sidebar text */
--sidebar-border: 220 13% 89%            /* Sidebar borders */
--sidebar-primary: 210 100% 45%          /* Active/selected items */
--sidebar-primary-foreground: 210 100% 98%
--sidebar-accent: 220 12% 88%            /* Hover state */
--sidebar-accent-foreground: 220 15% 20%
--sidebar-ring: 210 100% 45%             /* Focus rings */
```

#### Interactive Colors
```css
--primary: 210 100% 45%          /* MSP Brand Blue - Buttons, links, active states */
--primary-foreground: 210 100% 98%

--secondary: 220 12% 87%         /* Secondary buttons */
--secondary-foreground: 220 15% 20%

--accent: 215 15% 89%            /* Accent highlights */
--accent-foreground: 215 15% 20%

--destructive: 0 85% 48%         /* Delete/error states - Red */
--destructive-foreground: 0 85% 98%
```

#### Content Colors
```css
--muted: 220 12% 90%             /* Muted backgrounds */
--muted-foreground: 220 10% 35%  /* Secondary text */
```

#### Popover/Dropdown Colors
```css
--popover: 0 0% 92%              /* Dropdown backgrounds */
--popover-foreground: 220 15% 15%
--popover-border: 220 13% 87%
```

#### Form Colors
```css
--input: 220 13% 75%             /* Input borders */
--ring: 210 100% 45%             /* Focus rings */
```

#### Chart Colors (for data visualization)
```css
--chart-1: 210 100% 42%          /* Blue */
--chart-2: 160 75% 38%           /* Green */
--chart-3: 280 65% 45%           /* Purple */
--chart-4: 25 90% 48%            /* Orange */
--chart-5: 340 80% 50%           /* Pink/Red */
```

---

### Dark Mode Colors

#### Base Colors
```css
--background: 220 6% 8%          /* Main background - Dark */
--foreground: 220 6% 92%         /* Main text - Light */
--border: 220 6% 18%             /* Default borders */
```

#### Card Colors
```css
--card: 220 6% 10%               /* Card background */
--card-foreground: 220 6% 92%    /* Card text */
--card-border: 220 6% 15%        /* Card borders */
```

#### Sidebar Colors
```css
--sidebar: 220 6% 12%                    /* Sidebar background */
--sidebar-foreground: 220 6% 92%         /* Sidebar text */
--sidebar-border: 220 6% 17%             /* Sidebar borders */
--sidebar-primary: 210 100% 50%          /* Active/selected items (brighter) */
--sidebar-primary-foreground: 210 100% 98%
--sidebar-accent: 220 10% 18%            /* Hover state */
--sidebar-accent-foreground: 220 6% 85%
--sidebar-ring: 210 100% 50%             /* Focus rings */
```

#### Interactive Colors
```css
--primary: 210 100% 50%          /* MSP Brand Blue (brighter) */
--primary-foreground: 210 100% 98%

--secondary: 220 10% 20%         /* Secondary buttons */
--secondary-foreground: 220 6% 85%

--accent: 215 12% 18%            /* Accent highlights */
--accent-foreground: 215 6% 85%

--destructive: 0 85% 52%         /* Delete/error states (brighter) */
--destructive-foreground: 0 85% 98%
```

#### Content Colors
```css
--muted: 220 10% 16%             /* Muted backgrounds */
--muted-foreground: 220 6% 70%   /* Secondary text */
```

#### Popover/Dropdown Colors
```css
--popover: 220 6% 14%            /* Dropdown backgrounds */
--popover-foreground: 220 6% 92%
--popover-border: 220 6% 19%
```

#### Form Colors
```css
--input: 220 8% 32%              /* Input borders */
--ring: 210 100% 50%             /* Focus rings */
```

#### Chart Colors (brighter for dark mode)
```css
--chart-1: 210 100% 65%          /* Blue */
--chart-2: 160 75% 60%           /* Green */
--chart-3: 280 65% 68%           /* Purple */
--chart-4: 25 90% 65%            /* Orange */
--chart-5: 340 80% 65%           /* Pink/Red */
```

---

## Elevation System

### Interactive Overlays
```css
/* Light Mode */
--elevate-1: rgba(0,0,0, .03)    /* Subtle hover - 3% black overlay */
--elevate-2: rgba(0,0,0, .08)    /* Strong active - 8% black overlay */

/* Dark Mode */
--elevate-1: rgba(255,255,255, .04)  /* Subtle hover - 4% white overlay */
--elevate-2: rgba(255,255,255, .09)  /* Strong active - 9% white overlay */
```

### Usage in Components
```tsx
// Automatic elevation on hover
<Button className="hover-elevate" />

// Strong elevation on press
<Card className="active-elevate-2" />

// Toggle state
<Button className="toggle-elevate toggle-elevated" />
```

---

## Border & Outline System

### Button & Badge Outlines
```css
/* Light Mode */
--button-outline: rgba(0,0,0, .10)   /* 10% opacity */
--badge-outline: rgba(0,0,0, .05)    /* 5% opacity (more subtle) */

/* Dark Mode */
--button-outline: rgba(255,255,255, .10)
--badge-outline: rgba(255,255,255, .05)
```

### Auto-Computed Borders
Borders are automatically darkened/lightened based on background:
```css
--opaque-button-border-intensity: -8  /* Light mode: darken 8% */
--opaque-button-border-intensity: 9   /* Dark mode: lighten 9% */

/* Auto-computed borders */
--primary-border: /* Primary color adjusted by intensity */
--secondary-border: /* Secondary color adjusted */
--accent-border: /* Accent color adjusted */
--destructive-border: /* Destructive color adjusted */
```

---

## Typography

### Font Families
```css
--font-sans: Open Sans, sans-serif      /* Primary font */
--font-serif: Georgia, serif            /* Headings (if needed) */
--font-mono: Menlo, monospace          /* Code/numbers */
```

### Font Sizes (via Tailwind)
- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px) - **Minimum for outdoor readability**
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px)

### Letter Spacing
```css
--tracking-normal: 0em  /* Default tracking */
```

---

## Spacing System

### Base Spacing Unit
```css
--spacing: 0.25rem  /* 4px base unit */
```

### Tailwind Spacing Scale (4px increments)
- `p-1`: 0.25rem (4px)
- `p-2`: 0.5rem (8px)
- `p-3`: 0.75rem (12px) - **Mobile card padding**
- `p-4`: 1rem (16px) - **Desktop padding**
- `p-6`: 1.5rem (24px)
- `p-8`: 2rem (32px)
- `gap-2`: 0.5rem (8px)
- `gap-3`: 0.75rem (12px)
- `gap-4`: 1rem (16px)
- `space-y-4`: 1rem vertical spacing
- `pb-24`: 6rem (96px) - **Mobile bottom nav clearance**

### Safe Area Insets (iOS notch support)
```css
pt-safe  /* padding-top: env(safe-area-inset-top) */
pb-safe  /* padding-bottom: env(safe-area-inset-bottom) */
```

---

## Border Radius

### Global Radius
```css
--radius: 0.5rem  /* 8px - Standard rounded corners */
```

### Tailwind Classes
- `rounded-sm`: 0.125rem (2px)
- `rounded-md`: 0.375rem (6px) - **Recommended for most UI**
- `rounded-lg`: 0.5rem (8px) - **Card corners**
- `rounded-full`: 9999px - **Circles and pills**

---

## Shadows

All shadows are currently disabled for flat design aesthetic.

```css
/* Light Mode */
--shadow-2xs: 0px 2px 0px 0px hsl(220 13% 88% / 0.00)
--shadow-xs: 0px 2px 0px 0px hsl(220 13% 88% / 0.00)
--shadow-sm: 0px 2px 0px 0px hsl(220 13% 88% / 0.00), ...
--shadow: 0px 2px 0px 0px hsl(220 13% 88% / 0.00), ...
--shadow-md: 0px 2px 0px 0px hsl(220 13% 88% / 0.00), ...
--shadow-lg: 0px 2px 0px 0px hsl(220 13% 88% / 0.00), ...
--shadow-xl: 0px 2px 0px 0px hsl(220 13% 88% / 0.00), ...
--shadow-2xl: 0px 2px 0px 0px hsl(220 13% 88% / 0.00)

/* Dark Mode */
--shadow-2xs: 0px 2px 0px 0px hsl(220 6% 6% / 0.00)
... (same pattern, all with 0 opacity)
```

---

## Component-Specific Colors

### Map Markers
- **Blue (Customer)**: `#3b82f6` or `text-blue-500`
- **Red (Lead)**: `#ef4444` or `text-red-500`
- **Green (Selected)**: `#10b981` or `text-green-500`

### Status Badges
- **Active Route**: `bg-green-500/10 text-green-700 dark:text-green-400`
- **Completed**: `bg-blue-500/10 text-blue-700 dark:text-blue-400`
- **Template**: `bg-purple-500/10 text-purple-700 dark:text-purple-400`

### Metric Cards (Home Page)
```css
/* Stops Completed Card */
from-green-50 to-emerald-50          /* Light gradient */
dark:from-green-950/20 dark:to-emerald-950/20
border-green-200 dark:border-green-800
text-green-700 dark:text-green-300

/* Distance Traveled Card */
from-blue-50 to-indigo-50
dark:from-blue-950/20 dark:to-indigo-950/20
border-blue-200 dark:border-blue-800
text-blue-700 dark:text-blue-300
```

### Mobile Header
```css
pt-safe                           /* iOS safe area */
px-4                              /* Horizontal padding */
bg-background/95                  /* 95% opacity background */
backdrop-blur                     /* Glassmorphism effect */
min-h-[56px]                     /* Consistent height */
```

### Bottom Navigation
```css
min-h-[64px]                     /* Touch-friendly height */
pb-safe                           /* iOS safe area bottom */
z-40                              /* Above content, below modals */
```

---

## Breakpoints (Tailwind)

```css
sm: 640px
md: 768px    /* Primary mobile/desktop breakpoint */
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Common Responsive Patterns
```tsx
// Mobile-only header
className="md:hidden"

// Desktop-only content
className="hidden md:block"

// Responsive padding
className="p-3 md:p-6"

// Responsive grid
className="grid grid-cols-2 md:grid-cols-3"
```

---

## Z-Index Layers

```css
z-0    /* Base layer */
z-10   /* Elevated content */
z-20   /* Dropdowns */
z-30   /* Sticky headers */
z-40   /* Bottom navigation */
z-50   /* Modals/dialogs */
z-999  /* Elevation overlays (::after pseudo-elements) */
```

---

## Animation & Transitions

### Standard Transitions
```tsx
className="transition-colors"  /* Color changes */
className="transition-all"     /* Multiple properties */
```

### Toast Notifications
```tsx
duration: 1000  /* 1 second auto-dismiss */
```

### Hover States
- Buttons/badges automatically elevate on hover (via `--elevate-1`)
- Cards use `hover-elevate` class for subtle interaction feedback
- Links use `hover:text-foreground` for color change

---

## Application-Specific Values

### GPS & Distance
- Proximity threshold: **800 feet** (~243 meters)
- Distance display: Miles (≥0.5mi) or Feet (<0.5mi)

### Route Planning
- Default radius: **25 miles**
- Minimum touch target: **44px** (iOS HIG standard)

### Mobile Constraints
- Minimum screen width: **320px** (iPhone SE)
- Safe area insets: iOS notch support via `env(safe-area-inset-*)`
- Bottom nav height: **64px** + safe area
- Header height: **56px** + safe area

---

## Usage Examples

### Creating a Button
```tsx
<Button variant="default">        {/* Uses --primary */}
<Button variant="secondary">      {/* Uses --secondary */}
<Button variant="outline">        {/* Border with transparent bg */}
<Button variant="ghost">          {/* No background until hover */}
<Button variant="destructive">    {/* Uses --destructive */}
```

### Creating a Card with Gradient
```tsx
<Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
```

### Adding Elevation
```tsx
<Card className="hover-elevate active-elevate-2">
```

### Responsive Layout
```tsx
<div className="p-3 md:p-6 space-y-4 md:space-y-6">
```

---

## Color Philosophy

1. **Subtle Contrast**: Borders and backgrounds have minimal contrast for clean aesthetic
2. **Auto-Adaptation**: Colors automatically adjust between light/dark modes
3. **Elevation Over Shadows**: Uses overlay technique instead of drop shadows
4. **Semantic Colors**: Primary (blue), Destructive (red), Success (green)
5. **Outdoor Readability**: High contrast text, minimum 16px body text

---

## Accessibility

- **Minimum touch target**: 44x44px for mobile buttons
- **Color contrast**: WCAG AA compliant for text
- **Focus rings**: `--ring` color at 2px width
- **Safe area support**: iOS notch avoidance
- **Large text**: Minimum 16px for field use readability

---

**Last Updated**: November 24, 2025
**Version**: 1.0
