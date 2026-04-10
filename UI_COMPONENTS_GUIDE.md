# 🎨 Orchid Lab - UI Components Style Guide (Pro Max Edition)

## 📌 Overview

Hướng dẫn này cung cấp thiết kế chi tiết cho các thành phần UI cốt lõi của Orchid Lab, được xây dựng theo "Claude UI/UX Pro Max" - với tiêu chí: **Tối giản, Sang trọng, Hiện đại, Lấy người dùng làm trung tâm**.

---

## 🔴 1. BUTTONS - Nút Bấm (Pro Max Interactive)

### Primary Button (Nút Hành Động Chính)

**Mục đích**: Hành động chính, CTA (Call-to-Action)

```
┌────────────────────────┐
│  ✓ Create New Report   │
└────────────────────────┘
```

**CSS Classes**:

```tsx
<Button variant="primary" size="md" onClick={handleCreate}>
  Create New Report
</Button>
```

**Styling Specs**:

```
Background:        #C41E3A (Orchid Primary)
Text Color:        #FFFFFF (White)
Padding:           12px 20px (Vertical × Horizontal)
Border Radius:     8px
Font Weight:       600 (SemiBold)
Font Size:         14px

States:
├─ Default:
│  └─ Box Shadow: 0 1px 2px rgba(196, 30, 58, 0.05)
├─ Hover:
│  ├─ Background: #A81830 (Darker)
│  ├─ Box Shadow: 0 2px 8px rgba(196, 30, 58, 0.2)
│  └─ Transform: translateY(-1px)
├─ Active (Pressed):
│  ├─ Background: #8B1628
│  └─ Transform: translateY(0)
└─ Disabled:
   ├─ Opacity: 0.6
   └─ Cursor: not-allowed
```

### Secondary Button (Nút Thao Tác Phụ)

**Mục đích**: Hành động phụ, Cancel, Deselect

```
┌────────────────────────┐
│    Cancel              │
└────────────────────────┘
```

**CSS Classes**:

```tsx
<Button variant="secondary" size="md" onClick={handleCancel}>
  Cancel
</Button>
```

**Styling Specs**:

```
Border:            2px solid #E5E7EB (Neutral-200)
Background:        Transparent
Text Color:        #374151 (Neutral-700)
Padding:           10px 18px
Border Radius:     8px

States:
├─ Default:
│  └─ Border Color: #E5E7EB
├─ Hover:
│  ├─ Border Color: #C41E3A (Orchid Primary)
│  ├─ Text Color: #C41E3A
│  └─ Background: #FCEEF2 (Orchid Pale)
└─ Active:
   ├─ Border Color: #A81830
   └─ Text Color: #A81830
```

### Icon Button (Nút Compact)

**Mục đích**: Thêm, Xóa, More, Notification, Menu

```
[→] [+] [✕] [⋮]
```

**CSS Classes**:

```tsx
<Button variant="ghost" size="sm" icon="→" />
```

**Styling Specs**:

```
Width & Height:    40px
Padding:           0
Display:           flex | align-items: center | justify-content: center
Border Radius:     6px
Background:        Transparent
Icon Size:         20px

States:
├─ Default:
│  └─ Color: #374151 (Neutral-700)
└─ Hover:
   ├─ Background: #F9FAFB (Neutral-50)
   └─ Color: #C41E3A (Orchid Primary)
```

### Danger Button (Nút Xóa/Cảnh báo)

**Mục đích**: Hành động nguy hiểm (Delete, Remove)

**CSS Classes**:

```tsx
<Button variant="danger" size="md" onClick={handleDelete}>
  Delete
</Button>
```

**Styling Specs**:

```
Background:        #DC2626 (Error Red)
Text Color:        #FFFFFF
Hover Background:  #991B1B (Darker Red)
Box Shadow:        0 1px 3px rgba(220, 38, 38, 0.2)
```

---

## 📦 2. CARDS - Thẻ Thông Tin (Container Elements)

### Standard Card

**Mục đích**: Wrapper cho nội dung, thông tin, hoặc form

```
┌─────────────────────────┐
│                         │
│   Card Content Area     │
│   (Generous Whitespace) │
│                         │
└─────────────────────────┘
```

**CSS Classes**:

```tsx
<Card hoverable>
  <p>Card content here...</p>
</Card>
```

**Styling Specs**:

```
Background:        #FFFFFF (White - Light Mode)
                   #1A1A1A (Darkest Gray - Dark Mode)
Border:            1px solid #E5E7EB (Neutral-200)
Border Radius:     12px
Padding:           24px (Pro Max ample spacing)
Box Shadow:        0 1px 3px rgba(0, 0, 0, 0.08)

Hover State:
├─ Box Shadow: 0 4px 12px rgba(0, 0, 0, 0.12)
├─ Border Color: #C41E3A (Orchid Primary) [if hoverable=true]
└─ Transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1)
```

### Data Card (Summary Card)

**Mục đích**: Hiển thị metric, KPI, statistic

```
┌──────────────────────────┐
│ 📊                       │
│                          │
│ Total Reports     (Xám)  │
│ 245               (Đỏ)   │
│ ↑ 12.5% last month       │
└──────────────────────────┘
```

**CSS Classes**:

```tsx
<DataCard
  icon="📊"
  label="Total Reports"
  value={245}
  description="↑ 12.5% from last month"
  color="orchid"
/>
```

**Styling Specs**:

```
Layout:            Flex column, gap 12px
Background:        Linear gradient (2 màu nhẹ)
                   orchid: #F5D0DB → #FCEEF2
                   success: #E8F5E9 → (lighter)
Border:            1px solid (tương ứng màu)
Border Radius:     12px
Padding:           20px-24px

Icon:
├─ Size: 32px
├─ Background: Màu semi-transparent
└─ Border Radius: 8px

Label:
├─ Font Size: 12px
├─ Font Weight: 500
├─ Color: Màu tương ứng (semi-dark)
└─ Text Transform: Optional UPPERCASE

Value:
├─ Font Size: 28px
├─ Font Weight: 700
├─ Color: Màu chính
└─ Margin Top: 8px

Description:
├─ Font Size: 12px
├─ Color: Semi-transparent
└─ Optional
```

**Colors Palette cho Data Card**:

```
orchid:   gradient(#F5D0DB, #FCEEF2)  | border #C41E3A
success:  gradient(#E8F5E9, #C8E6C9)  | border #1F7E56
warning:  gradient(#FEF3C7, #FCD34D)  | border #F59E0B
error:    gradient(#FEE2E2, #FECACA)  | border #DC2626
info:     gradient(#EBF2FB, #BCDAF5)  | border #2C5AA0
```

---

## 🏷️ 3. BADGES & STATUS INDICATORS

### Status Badge (Inline)

**Mục đích**: Hiển thị status, state, tag

```
[✓ Seen]  [⏳ Pending]  [✕ Error]
```

**CSS Classes**:

```tsx
<Badge label="Seen" variant="success" icon="✓" />
<Badge label="Pending" variant="warning" icon="⏳" />
<Badge label="Error" variant="error" icon="✕" />
```

**Styling Specs**:

```
General:
├─ Display: inline-flex
├─ Align Items: center
├─ Gap: 6px
├─ Padding: 4px 12px
├─ Border Radius: 12px (Full rounded - organic feel)
├─ Font Size: 12px
├─ Font Weight: 500
└─ Border: 1px solid (tương ứng)

Variants:
├─ success:
│  ├─ Background: #E8F5E9
│  ├─ Color: #1F7E56
│  └─ Border: #1F7E56
├─ warning:
│  ├─ Background: #FEF3C7
│  ├─ Color: #92400E
│  └─ Border: #F59E0B
├─ error:
│  ├─ Background: #FEE2E2
│  ├─ Color: #991B1B
│  └─ Border: #DC2626
├─ info:
│  ├─ Background: #EBF2FB
│  ├─ Color: #1E3A8A
│  └─ Border: #2C5AA0
└─ neutral:
   ├─ Background: #F3F4F6
   ├─ Color: #374151
   └─ Border: #D1D5DB
```

---

## 📝 4. INPUT FIELDS & FORMS

### Text Input

**Mục đích**: Nhập dữ liệu, tìm kiếm

```
[🔍 Search reports...          ]
```

**CSS Classes**:

```tsx
<Input
  label="Search Reports"
  placeholder="Search reports by name, technician..."
  icon="🔍"
/>
```

**Styling Specs**:

```
Layout:
├─ Label:
│  ├─ Font Size: 13px
│  ├─ Font Weight: 600
│  ├─ Color: #374151 (Neutral-700)
│  └─ Margin Bottom: 8px
└─ Input Field:

Input Field:
├─ Background: #FFFFFF
├─ Border: 1px solid #E5E7EB (Neutral-200)
├─ Border Radius: 8px
├─ Padding: 12px 16px (generous)
├─ Font Size: 14px
├─ Color: #374151
├─ Transition: 0.2s ease-out

Focus State:
├─ Border Color: #C41E3A (Orchid Primary)
├─ Box Shadow: 0 0 0 3px rgba(196, 30, 58, 0.1)
└─ Outline: none

Placeholder:
├─ Color: #9CA3AF (Neutral-400)
└─ Font Style: normal (not italic)

Error State:
├─ Border Color: #DC2626 (Error)
├─ Background: #FEE2E2 (Light Red)
└─ Error Message: 11px, #DC2626, Font Weight 500
```

### Search Bar (Rounded Variant)

```
[🔍 _____________________________ ]
```

**Styling Specs** (Additional):

```
Border Radius:     50px (Full rounded - organic)
Padding Left:      40px (for icon)
Icon Position:     absolute left-4 top-50%
```

---

## 📊 5. DATA TABLES - Bảng Dữ Liệu

### Table Structure

```
┌────────────────────────────────────────────────┐
│ NAME │ DESCRIPTION │ WRITER │ STATUS │ ACTION │ ← Header (Uppercase, Bold)
├────────────────────────────────────────────────┤
│ ...  │ ...         │ ...    │ ✓      │ →      │ ← Body Row (Hover BG)
│ ...  │ ...         │ ...    │ ⏳     │ →      │
│ ...  │ ...         │ ...    │ ✓      │ →      │
└────────────────────────────────────────────────┘
```

### Table Header

**Styling Specs**:

```
Background:        #F9FAFB (Neutral-50)
Border Bottom:     2px solid #E5E7EB
Text Color:        #374151 (Neutral-700)
Font Weight:       600 (SemiBold)
Font Size:         12px
Text Transform:    UPPERCASE
Letter Spacing:    0.05em
Padding:           12px 16px
```

### Table Body Row

**Styling Specs**:

```
Background:        #FFFFFF (Normal)
                   #F9FAFB (Hover)
Border Bottom:     1px solid #E5E7EB
Text Color:        #374151 (Neutral-700)
Font Size:         14px
Padding:           16px
Transition:        0.15s ease-out

Hover State:
├─ Background: #F9FAFB
├─ Cursor: pointer
└─ Slight elevation
```

### Table Column Alignment

```
Text Columns:     align-left
Number Columns:   align-right
Status/Actions:   align-center
Dates:            align-center
```

---

## 🔢 6. PAGINATION - Điều hướng Trang

### Pagination Layout

```
Showing 5 out of 245 reports  « 1 2 3 4 5 »
```

### Button Styles

**Inactive Page Button**:

```
Background:        #F3F4F6 (Neutral-100)
Border:            1px solid #E5E7EB
Text Color:        #374151
Border Radius:     6px
Padding:           8px 12px
Font Weight:       500

Hover:
├─ Background: #E5E7EB
├─ Border Color: #C41E3A (Orchid Primary)
└─ Color: #C41E3A
```

**Active Page Button**:

```
Background:        #C41E3A (Orchid Primary)
Text Color:        #FFFFFF
Border:            none
Border Radius:     6px
Padding:           8px 12px
Font Weight:       600
Box Shadow:        0 2px 8px rgba(196, 30, 58, 0.2)
```

**Navigation Buttons (Next, Previous)**:

```
Shape:             ← (Left Arrow) | → (Right Arrow)
Style:             Same as inactive page button
Width:             40px (square)
Font Size:         18px
```

---

## 🪟 7. MODALS & DIALOGS

### Modal Structure

```
┌─────────────────────────────────────────┐
│ Create New Report                   [×] │ ← Header
├─────────────────────────────────────────┤
│                                         │
│  [Form Fields]                          │ ← Body
│                                         │
├─────────────────────────────────────────┤
│              [Cancel]  [Create]         │ ← Footer
└─────────────────────────────────────────┘
```

### Modal Styling

**Container**:

```
Background:        #FFFFFF (White)
Border Radius:     12px
Box Shadow:        0 20px 25px rgba(0, 0, 0, 0.2)
Max Width:         500px (Medium) / 700px (Large)
Margin:            auto (centered)
Padding:           24px
Animation:         slideUp 0.2s ease-out + fadeIn
```

**Backdrop**:

```
Background:        rgba(0, 0, 0, 0.5)
Position:          fixed full-screen
Animation:         fadeIn 0.2s ease-out
```

**Header**:

```
Display:           flex justify-between
Padding Bottom:    16px
Border Bottom:     1px solid #E5E7EB
Font Size:         20px
Font Weight:       600
Color:             #111827 (Dark-900)
```

**Body**:

```
Padding:           24px 0
Max Height:        60vh
Overflow:          auto
```

**Footer**:

```
Display:           flex justify-end gap-3
Padding Top:       16px
Border Top:        1px solid #E5E7EB
```

---

## 🎯 8. LOADING STATES & SKELETONS

### Loading Animation

**Pulse Animation**:

```css
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

### Skeleton (Placeholder)

**Styling**:

```
Background:        #E5E7EB (Neutral-200)
Border Radius:     6px
Height:            16px (default) / customizable
Width:             100% (default) / customizable
Animation:         pulse 2s infinite
Margin Bottom:     12px (between rows)
```

---

## 🔔 9. ALERTS & NOTIFICATIONS

### Alert Box

```
┌────────────────────────────────┐
│ ✓ Success! Report created     │
└────────────────────────────────┘
```

### Alert Styling

**General**:

```
Display:           flex items-start gap-3
Border Radius:     8px
Padding:           16px
Border:            1px solid (tương ứng màu)
Transition:        0.2s ease-out
```

**Variants**:

```
success:
├─ Background: #E8F5E9
├─ Text Color: #1F7E56
├─ Border Color: #1F7E56
└─ Icon: ✓

warning:
├─ Background: #FEF3C7
├─ Text Color: #92400E
├─ Border Color: #F59E0B
└─ Icon: ⚠

error:
├─ Background: #FEE2E2
├─ Text Color: #991B1B
├─ Border Color: #DC2626
└─ Icon: ✕

info:
├─ Background: #EBF2FB
├─ Text Color: #1E3A8A
├─ Border Color: #2C5AA0
└─ Icon: ⓘ
```

---

## 🎨 10. DARK MODE - Tối xem

Tất cả components hỗ trợ Dark Mode qua CSS Custom Properties:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: #1a1a1a;
    --color-surface-secondary: #2d2d2d;
    --color-text-primary: #e5e5e5;
    --color-border-primary: #4d4d4d;
    /* ... etc */
  }
}
```

**Toggle Implementation**:

```tsx
const [isDarkMode, setIsDarkMode] = useState(false);

useEffect(() => {
  if (isDarkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, [isDarkMode]);
```

---

## 📐 11. SPACING & LAYOUT GRID

### 8px Grid System

```
4px  (micro)
8px  (xs) ← Basic unit
12px (sm)
16px (md) ← Most common
20px (lg)
24px (xl) ← Section padding
32px (2xl)
40px (3xl)
48px (4xl)
```

### Pro Max Spacing Philosophy

- **Generous whitespace** = Elegance
- **Minimum padding** = 16px (between elements)
- **Section gaps** = 24-32px
- **Card padding** = 20-24px
- **Focus on breathing room** = Luxury feeling

---

## ⌨️ 12. KEYBOARD ACCESSIBILITY

### Focus Indicator (Pro Max)

```css
:focus-visible {
  outline: 2px solid #c41e3a;
  outline-offset: 2px;
}
```

### Tab Order

- Logical flow: left-to-right, top-to-bottom
- Interactive elements in order
- Skip nav available (if long page)

### Semantic HTML

- Use `<button>` for buttons (not `<div>`)
- Use `<input>` for form controls
- Use `<table>` for data tables
- Use `<nav>` for navigation
- ARIA labels where needed

---

## ✅ WCAG 2.1 Compliance

- **Contrast Ratio**: 4.5:1 minimum (AA level)
- **Touch Targets**: 44×44px minimum (mobile)
- **Color Not Sole Cue**: Icons + text for status
- **Keyboard Navigation**: All functionality accessible via keyboard
- **Screen Reader**: Proper semantic HTML + ARIA

---

## 📚 IMPLEMENTATION CHECKLIST

- [ ] Import globals.css in index.css
- [ ] Import Tailwind configuration (tailwind.config.ts)
- [ ] Use Button component from UILib
- [ ] Use Card component for containers
- [ ] Use Badge for status indicators
- [ ] Use Input for form controls
- [ ] Use Modal for dialogs
- [ ] Use Pagination for table navigation
- [ ] Test dark mode toggle
- [ ] Verify contrast ratios (WCAG AA)
- [ ] Test keyboard navigation
- [ ] Test screen reader (NVDA, JAWS, VoiceOver)

---

**Design Document Version**: 1.0  
**Orchid Lab Pro Max UI Components Guide**  
**Last Updated**: April 2026  
**Status**: Ready for Implementation ✓
