# MSP Diesel Field Sales Route App - Design Guidelines

## Design Approach

**System-Based Approach**: Shadcn UI + Tailwind CSS with mobile-first, utility-focused patterns
**Reference Inspiration**: Google Maps (navigation UI), Linear (clean productivity aesthetics)

**Core Principle**: Outdoor-optimized field service tool prioritizing readability, touch accessibility, and rapid task completion over visual decoration.

---

## Typography

**Font Stack**: System fonts for performance
- **Primary**: `font-sans` (Inter via Shadcn default)
- **Monospace**: `font-mono` for coordinates/measurements

**Hierarchy**:
- **Page Titles**: `text-2xl font-semibold` (24px)
- **Section Headers**: `text-lg font-medium` (18px)
- **Body Text**: `text-base` (16px) - critical for outdoor readability
- **Secondary/Meta**: `text-sm text-muted-foreground` (14px)
- **Tiny Labels**: `text-xs` (12px) - map markers, badges only

**Line Height**: Use Tailwind defaults (`leading-normal`, `leading-relaxed` for dense lists)

---

## Layout System

**Spacing Primitives**: Limit to `2, 3, 4, 6, 8` units
- **Tight spacing**: `p-2, gap-2` (buttons, compact lists)
- **Standard spacing**: `p-4, gap-4` (cards, panels)
- **Section spacing**: `p-6, gap-6` (page sections)
- **Large gutters**: `p-8` (outer containers)

**Container Strategy**:
- **Full-width maps**: `w-full h-screen` - no padding
- **Content panels**: `max-w-7xl mx-auto px-4`
- **Bottom sheets**: `fixed bottom-0 left-0 right-0` with `rounded-t-2xl`
- **Dialogs**: `max-w-lg` centered overlay

**Responsive Breakpoints**: Mobile-first, optimize for phone (360-428px)

---

## Component Library

### Core Navigation
- **Bottom Sheet Panel**: Fixed bottom overlay with drag handle, `rounded-t-2xl shadow-2xl`
- **Top Nav**: Simple header with back button, page title, action buttons
- **No sidebar**: All navigation via bottom sheet or dialog overlays

### Map Components
- **Interactive Map**: Full-screen Mapbox GL with custom markers
- **User Location**: Green circular marker (14px) with accuracy ring
- **Company Markers**: Blue dots (14px) - clickable with hover state
- **Route Line**: Solid line connecting stops in sequence order
- **No backdrop**: Map remains interactive when panels open

### Lists & Cards
- **Route Stop Cards**: 
  - White background with `border rounded-lg`
  - Company name (font-medium), address (text-sm text-muted)
  - Distance/ETA in `text-xs` badge
  - Check-in button (green) or "Add Stop" (blue)
  - Minimum `min-h-[88px]` for touch targets

- **Company Search Results**:
  - Dense list with checkboxes
  - Scrollable in dialog (`max-h-96 overflow-y-auto`)
  - Selected state with blue background tint

### Forms & Inputs
- **Touch Targets**: All interactive elements minimum `h-11` (44px)
- **Input Fields**: Shadcn Input component with clear labels
- **Buttons**: 
  - Primary: `bg-primary text-primary-foreground h-11`
  - Secondary: `bg-secondary`
  - Destructive: `bg-destructive` (skip, delete)
  - Minimum width `min-w-24` for text buttons

- **Search Input**: Prominent at top of dialogs with magnifying glass icon

### Data Display
- **Metrics Cards**: Grid layout `grid-cols-3 gap-4`
  - Large number: `text-3xl font-bold`
  - Label: `text-sm text-muted-foreground`
  - Icon: Lucide icons in `text-primary`

- **Summary Table**: Simple borders, alternating row backgrounds for dense data
- **Distance Badges**: Rounded pill `bg-secondary px-2 py-1 text-xs`
  - Format: "1,200 ft" or "2.4 mi"

### Alerts & Notifications
- **Proximity Alert**: Toast notification (Shadcn Toast)
  - Green background for arrival
  - Auto-dismiss after 5 seconds
  - Sound notification (browser native)

- **Error States**: Red toast with error icon
- **Success States**: Green toast with checkmark

---

## Accessibility & Safety

**High Contrast Mode**: Default theme optimized for outdoor visibility
- Strong border definitions (`border-2` for critical elements)
- No low-contrast grays (minimum `text-gray-600`)
- Clear focus states with `ring-2 ring-primary`

**Touch Optimization**:
- All buttons/links minimum 44px height
- Generous spacing between interactive elements (`gap-4`)
- No tiny close buttons - use full-width "Cancel" or swipe-down gesture

**Loading States**: Shadcn Skeleton for map/list loading, simple spinner for buttons

---

## Mobile-Specific Patterns

**Bottom Sheet Behavior**:
- Drag handle at top (visual affordance)
- Swipe down to minimize/close
- Snap points: collapsed (96px), half (50vh), full (90vh)
- Translucent backdrop when expanded (optional)

**Scroll Behavior**:
- Overscroll bounce disabled on map
- Smooth scroll in lists (`scroll-smooth`)
- Pull-to-refresh for company sync (native browser)

**Orientation**: Portrait only (lock via manifest.json)

---

## Images

**No decorative images** - This is a utility app, not a marketing page.

**Functional imagery only**:
- **Map tiles**: Mapbox streets (default theme)
- **User avatar**: Optional in top nav (Shadcn Avatar with initials fallback)
- **Company logos**: Not implemented (performance concern with 1,700+ companies)

---

## Animations

**Minimal animations** - battery and performance critical:
- **Allowed**: 
  - Bottom sheet slide-up transition (300ms ease)
  - Toast fade-in/out
  - Button press feedback (scale 0.98)
  - Skeleton pulse for loading states

- **Forbidden**:
  - Map marker animations (CPU intensive)
  - Auto-playing transitions
  - Parallax effects
  - Hover animations (mobile context)

---

## Visual Theme

**Color Strategy**: Rely on Shadcn's semantic tokens, no custom color palette needed
- Primary actions: `bg-primary` (blue)
- Success states: `bg-green-600`
- Destructive: `bg-destructive` (red)
- Backgrounds: `bg-background`, `bg-card`
- Borders: `border-border`

**Outdoor Optimization**:
- Prefer darker text on light backgrounds (better sunlight readability)
- Avoid pure white (#FFFFFF) - use `bg-background` (slight gray tint)
- Strong border contrast for depth perception

---

## Production Constraints

**Performance Budget**:
- No custom fonts (system fonts only)
- Minimize re-renders on map pan/zoom
- Lazy load dialogs (React.lazy)
- Debounce search inputs (300ms)

**Offline Handling**:
- Display cached route data when offline
- Show clear "Offline" indicator in nav
- Disable sync-dependent actions gracefully

---

## Key Screens Layout

**1. Login**: Centered card with logo, username/password fields, demo credentials hint

**2. Route Planning**: 
- Full-screen map with floating search bar top
- Bottom sheet showing filtered companies list
- "Optimize Route" FAB (floating action button)

**3. Active Route**:
- Full-screen map with route line
- Bottom sheet with stop checklist
- Current stop highlighted with pulsing marker

**4. Daily Summary**:
- Top metrics cards (3-column grid)
- Scrollable visit list below
- Date picker and "Export CSV" in header

All screens use consistent top nav (back button + title + actions) except map views where nav is minimal to maximize viewport.