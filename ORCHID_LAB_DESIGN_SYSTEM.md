# 🌸 ORCHID LAB - Design System Documentation

**Theme**: Premium Biological Research Laboratory UI/UX  
**Philosophy**: "Claude UI/UX Pro Max" - Minimalist, Elegant, User-Centric  
**Primary Brand Color**: Ruby Red (Burgundy-inspired)

---

## 📋 Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing & Layout](#spacing--layout)
4. [Components](#components)
5. [Implementation Guidelines](#implementation-guidelines)

---

## 🎨 Color Palette

### Primary Reds (Màu Đỏ Chủ Đạo)

```
#A4161A - Ruby Red (Brand Primary, Borders, Accents)
#D62828 - Rich Red (Active states, CTAs)
#E63946 - Coral Red (Hover states)
#F8D7DA - Light Red (Subtle backgrounds)
```

### Neutrals (Nền & Typography)

```
#F8F7F2 - Orchid White (Page background, premium feel)
#FFFFFF - Pure White (Card backgrounds)
#1A1A1A - Dark Text (Primary content)
#6B7280 - Mid Gray (Secondary text, placeholders)
#E5E7EB - Light Border (Dividers, subtle lines)
#F3F4F6 - Ultra Light (Hover backgrounds)
```

### Semantic Colors

```
✅ Success: #059669 (green-600) - For "Seen" status
⚠️ Warning: #D97706 (amber-600) - For "Pending" status
🔴 Error: #DC2626 (red-600) - For critical alerts
ℹ️ Info: #0891B2 (cyan-600) - For informational badges
```

---

## 📐 Typography

### Font Stack

```
Primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Fallback: system-ui, sans-serif
```

### Hierarchy

| Element   | Size | Weight     | Letter-spacing | Use Case            |
| --------- | ---- | ---------- | -------------- | ------------------- |
| **H1**    | 28px | 700 (Bold) | -0.5px         | Page titles         |
| **H2**    | 20px | 600 (Semi) | -0.25px        | Section headers     |
| **Body**  | 14px | 400 (Reg)  | 0px            | Main content        |
| **Small** | 12px | 400 (Reg)  | 0px            | Metadata            |
| **Label** | 11px | 600 (Semi) | 0.5px          | Form labels, badges |

### Usage Examples

```jsx
// H1
<h1 className="text-3xl font-bold text-stone-900 tracking-tight">
  Page Title
</h1>

// H2
<h2 className="text-2xl font-semibold text-stone-900 tracking-normal">
  Section Title
</h2>

// Body
<p className="text-base font-normal text-stone-900">
  Regular paragraph content
</p>

// Label
<label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
  Form Label
</label>
```

---

## 🎯 Spacing & Layout

### Spacing Scale (Tailwind)

```
xs: 4px (2)
sm: 8px (4)
md: 12px (6)
lg: 16px (8)
xl: 24px (12)
2xl: 32px (16)
```

### Golden Rules

- **Micro spacing**: 4-8px for adjacent elements
- **Section spacing**: 16-24px between major sections
- **Large spacing**: 32px+ for disconnected content areas
- **Whitespace > Content**: Aim for 40-60% whitespace ratio

### Border Radius

```
Subtle: rounded-lg (8px) - Inputs, small components
Moderate: rounded-xl (12px) - Cards, modals
Generous: rounded-2xl (16px) - Large containers
Pill: rounded-full (9999px) - Rarely used (only special cases)
```

### Shadows

```
Subtle: shadow-sm = 0 1px 2px rgba(0,0,0,0.05)
Medium: shadow-md = 0 4px 12px rgba(0,0,0,0.08)
Elevated: shadow-lg = 0 8px 24px rgba(0,0,0,0.1)
```

---

## 🧩 Components

### 1. **Search/Filter Input**

```jsx
<div className="relative">
  <input
    type="text"
    className="w-full border-2 border-stone-200 rounded-lg px-5 py-3 pl-12 text-stone-900 placeholder-stone-400 transition-all duration-200 focus:outline-none focus:border-red-700 focus:shadow-md"
    placeholder="Search..."
  />
  <span className="absolute left-4 top-3.5 text-stone-400">
    <svg>...</svg>
  </span>
</div>
```

**Key Features:**

- Border: 2px solid #E5E7EB (light gray)
- Focus: Turns #A4161A (ruby red) with shadow
- Padding: 12px vertical, 20px horizontal
- Border radius: 8px (subtle)

---

### 2. **Data Table**

#### Table Header

```jsx
<thead>
  <tr className="bg-gradient-to-r from-stone-50 to-stone-100 border-b-2 border-red-700">
    <th className="py-4 px-6 text-sm font-bold text-stone-900 uppercase tracking-wider">
      Column Title
    </th>
  </tr>
</thead>
```

**Features:**

- Gradient background (soft, not harsh)
- Bold text, uppercase, wide letter spacing
- Thick bottom border in ruby red (#A4161A)

#### Table Body Rows

```jsx
<tbody>
  <tr className="border-b border-stone-100 hover:bg-red-50 transition-colors duration-200">
    <td className="py-4 px-6 font-medium text-stone-900">{content}</td>
  </tr>
</tbody>
```

**Features:**

- Hover state: Light red background (#FEF2F2)
- Subtle border between rows (#E5E7EB)
- Smooth transition (200ms)
- Good vertical padding for reading

#### Status Badges

```jsx
<span className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors bg-green-100 text-green-700 border-green-200">
  Seen
</span>

<span className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors bg-amber-100 text-amber-700 border-amber-200">
  Pending
</span>
```

---

### 3. **Action Buttons**

#### Primary CTA Button

```jsx
<button className="inline-flex items-center gap-2 px-4 py-2 border-2 border-red-700 text-red-700 rounded-lg font-semibold hover:bg-red-700 hover:text-white transition-all duration-200 hover:shadow-md">
  Action Text
  <svg>...</svg>
</button>
```

**States:**

- Default: Transparent with ruby red border + text
- Hover: Filled ruby red background + white text + shadow
- Transition: 200ms smooth

---

### 4. **Metric Summary Cards**

```jsx
<div className="bg-white rounded-xl shadow-md border-l-4 border-red-700 p-6 hover:shadow-lg transition-shadow">
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
        Metric Label
      </div>
      <div className="text-4xl font-bold text-red-700 mt-2">{value}</div>
    </div>
    <div className="text-5xl opacity-10 text-red-700">📊</div>
  </div>
</div>
```

**Key Features:**

- Left border accent (4px solid ruby red)
- Shadow elevation for depth
- Large, bold number in brand color
- Icon with low opacity as visual accent

---

### 5. **Pagination Controls**

```jsx
<div className="flex gap-1.5 items-center">
  {/* Previous button */}
  <button className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 hover:bg-red-700 hover:text-white transition-all duration-200 font-bold flex items-center justify-center hover:shadow-md">
    ←
  </button>

  {/* Page numbers */}
  {/* Active page: ruby red background, white text */}
  {/* Inactive: light stone background */}

  {/* Next button */}
  <button className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 hover:bg-red-700 hover:text-white transition-all duration-200 font-bold">
    →
  </button>
</div>
```

---

### 6. **Container Sections**

```jsx
// Main page container
<main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gradient-to-b from-stone-50 to-stone-100">
  <div className="max-w-7xl mx-auto px-8 py-8">
    {/* Content */}
  </div>
</main>

// Card/Section container
<div className="bg-white rounded-xl shadow-md p-6 border border-stone-200">
  {/* Content */}
</div>
```

---

## 🎭 Implementation Guidelines

### DO's ✅

- Use generous whitespace (40-60% of layout)
- Apply consistent shadows for depth hierarchy
- Use ruby red (#A4161A) as accent, not background fill
- Keep transitions smooth (200ms-300ms)
- Maintain strong visual hierarchy with typography
- Use stone/neutral palette for backgrounds

### DON'Ts ❌

- Don't use bright/neon reds - stick to burgundy/ruby
- Don't make elements too compact - embrace whitespace
- Don't mix too many colors - max 2-3 accent colors
- Don't use rapid animations - keep it smooth and professional
- Don't over-shadow - 1-2 shadow per component

### Accessibility Checklist

- [ ] Text contrast ≥ 4.5:1 for standard text
- [ ] Focus states clearly visible (border + outline)
- [ ] Buttons minimum 44px clickable area
- [ ] Color not the only indicator (use text/icons too)
- [ ] Semantic HTML (use `<button>`, `<label>`, etc.)

---

## 🔄 CSS Classes Quick Reference

### Commonly Used Classes (Tailwind v4)

```
/* Colors */
text-red-700, bg-red-700, border-red-700
text-stone-900, text-stone-600, text-stone-400
bg-stone-50, bg-stone-100, bg-white

/* Layout */
flex, grid, gap-4, flex-col, items-center, justify-between
max-w-7xl, mx-auto, px-8, py-8
w-full, h-full, min-h-screen

/* Typography */
text-xl, font-bold, font-semibold, font-normal
uppercase, tracking-wider, tracking-tight

/* Borders & Radius */
rounded-lg, rounded-xl, rounded-full
border-2, border-l-4
shadow-md, shadow-lg

/* Transitions */
transition-all, duration-200, hover:, focus:

/* States */
hover:bg-red-700, focus:border-red-700, focus:shadow-md
```

---

## 📱 Responsive Design

Use Tailwind breakpoints:

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

Example:

```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* 1 col on mobile, 3 cols on medium+ */}
</div>
```

---

## 🎯 Brand Promise

The Orchid Lab design system delivers:

- **Scientific Credibility**: Clean, organized, data-focused
- **Premium Feel**: Elegant spacing, sophisticated colors
- **User-Centric**: Clear hierarchy, easy navigation
- **Modern**: Smooth transitions, thoughtful interactions

---

## 📞 Questions?

Refer to specific component sections above. This system is designed to scale across all admin pages while maintaining visual consistency and brand identity.

**Last Updated**: April 2026  
**Version**: 1.0 - Professional Beta
