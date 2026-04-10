# 🌺 Orchid Lab - Design System & UI/UX Guidelines (Pro Max Edition)

## 📌 Tổng Quan Thiết Kế

**Triết Lý Thiết Kế**: Khoa học, tối giản, sang trọng, hữu cơ  
**Chủ Đạo**: Phòng Thí Nghiệm Sinh Học (Cấy Ghép Hoa Lan)  
**Phong Cách**: Claude UI/UX Pro Max - Whitespace lồng, Typography rõ ràng, Bóng mượt

---

## 🎨 DESIGN SYSTEM & COLOR PALETTE

### 1. Primary Brand Colors (Màu Hoa Lan Đỏ Sang Trọng)

```
┌─────────────────────────────────────────┐
│ ORCHID RED - Sắc Đỏ Chính Thương Hiệu   │
├─────────────────────────────────────────┤
│ Primary (Ruby Deep)    #C41E3A           │ ← Màu chủ đạo, active state, CTA
│ Primary Light         #E85D75           │ ← Hover state, highlight
│ Primary Lighter       #F5D0DB           │ ← Background subtle
│ Primary Pale          #FCEEF2           │ ← Very light background
└─────────────────────────────────────────┘
```

**Tại sao chọn #C41E3A?**

- Là sắc đỏ burgundy/ruby (không quá sáng gây bực)
- Tạo cảm giác sang trọng, khoa học, chuyên nghiệp
- Tương phản tốt với nền sáng
- Phù hợp với chủ đề "Orchid" (hoa lan tím-đỏ)

### 2. Tertiary Colors (Các Màu Hỗ Trợ)

```
GREEN (Bổ sung - Sinh Học/Tự Nhiên)
├─ #1F7E56  ← Sage Green (Success, Forest vibe)
├─ #4CAF59  ← Fresh Green
└─ #E8F5E9  ← Light Green Background

PURPLE (Phủ Hợp với Hoa Lan)
├─ #7B68A6  ← Soft Purple (Secondary accent)
└─ #F3E7FA  ← Light Purple Background

SCIENTIFIC BLUE (Độc Lập/Tin Cậy)
├─ #2C5AA0  ← Indigo (Information, Trust)
└─ #EBF2FB  ← Light Blue Background
```

### 3. Neutral Colors (Xám Trung Tính)

```
LIGHT MODE (Mặc định)
├─ Background Surface    #FFFFFF
├─ Subtle BG             #F9FAFB     (Gray-50)
├─ Light Gray            #F3F4F6     (Gray-100)
├─ Border Color          #E5E7EB     (Gray-200)
├─ Secondary Text        #9CA3AF     (Gray-400)
├─ Primary Text          #374151     (Gray-700)
└─ Dark Text             #1F2937     (Gray-900)

DARK MODE
├─ Background Surface    #1A1A1A
├─ Subtle BG             #2D2D2D
├─ Light Gray            #404040
├─ Border Color          #4D4D4D
├─ Secondary Text        #A0A0A0
├─ Primary Text          #E5E5E5
└─ Light Text            #F5F5F5
```

### 4. Status & Semantic Colors

```
SUCCESS     #1F7E56  (Green - Thành công, hoàn thành)
WARNING     #F59E0B  (Amber - Cảnh báo, chờ duyệt)
ERROR       #DC2626  (Red - Lỗi, xóa)
INFO        #2C5AA0  (Blue - Thông tin)
```

---

## 🔤 TYPOGRAPHY & LAYOUT STRUCTURE

### 1. Font Stack (Recommended)

```css
/* Heading Font - Sang trọng, rõ ràng */
font-family:
  "Inter",
  "Segoe UI",
  -apple-system,
  sans-serif;

/* Body Font - Dễ đọc, chuyên nghiệp */
font-family:
  -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu",
  "Cantarell", sans-serif;

/* Monospace - Dữ liệu, code */
font-family: "Fira Code", "Monaco", "Courier New", monospace;
```

### 2. Font Hierarchy (Phân Cấp Chữ)

```
H1 (Page Title)
├─ Font Size: 32px
├─ Font Weight: 700 (Bold)
├─ Line Height: 1.2
├─ Letter Spacing: -0.02em
└─ Color: Primary (C41E3A) or Gray-900

H2 (Section Title)
├─ Font Size: 24px
├─ Font Weight: 600 (SemiBold)
├─ Line Height: 1.3
└─ Color: Gray-900

H3 (Subsection)
├─ Font Size: 18px
├─ Font Weight: 600
└─ Color: Gray-900

Body Regular
├─ Font Size: 14px | 16px
├─ Font Weight: 400
├─ Line Height: 1.6
└─ Color: Gray-700

Body Small (Secondary Text)
├─ Font Size: 12px | 13px
├─ Font Weight: 400
├─ Line Height: 1.5
└─ Color: Gray-500

Label/Badge
├─ Font Size: 11px | 12px
├─ Font Weight: 500 (Medium)
├─ Text Transform: Optional uppercase
└─ Letter Spacing: 0.05em
```

### 3. Layout Structure (Admin Dashboard)

```
┌────────────────────────────────────────────────────────────┐
│                       TOP BAR (Topbar)                      │
│  Logo | Search Bar | Notifications | User Profile            │
│  Height: 64px | Background: White | Shadow: Soft           │
└────────────────────────────────────────────────────────────┘

┌─────────────┬──────────────────────────────────────────────┐
│             │                                              │
│  SIDEBAR    │       MAIN CONTENT AREA (Fluid)             │
│  (280px)    │  ┌──────────────────────────────────────┐  │
│             │  │ Page Title + Action Buttons          │  │
│  • Dashboard│  ├──────────────────────────────────────┤  │
│  • Reports  │  │                                      │  │
│  • Settings │  │  Filters | Search | Sorting        │  │
│  • ...      │  ├──────────────────────────────────────┤  │
│             │  │                                      │  │
│  Fixed      │  │  Data Table / Cards / Charts       │  │
│  Position   │  │                                      │  │
│  (300-320px)│  │  Pagination                         │  │
│             │  └──────────────────────────────────────┘  │
│             │                                              │
└─────────────┴──────────────────────────────────────────────┘

Main Content Padding: 24-32px (Giãn cách rộng - Pro Max)
Topbar Height: 64px
Sidebar Width: 280px (fixed)
Content Max-Width: Responsive (no max-width restriction)
```

---

## 📦 UI COMPONENTS STYLE GUIDE

### 1. BUTTONS & CTAs

#### Primary Button (CTA Chính)

```
┌─────────────────────┐
│  Create New Report  │  (Với text/icon)
└─────────────────────┘

Style:
├─ Background: #C41E3A (Primary Red)
├─ Text Color: #FFFFFF
├─ Padding: 12px 20px (Vertical × Horizontal)
├─ Border Radius: 8px
├─ Font Weight: 600 (SemiBold)
├─ Font Size: 14px
├─ Box Shadow: 0 2px 8px rgba(196, 30, 58, 0.2)
├─ Hover State:
│  ├─ Background: #A81830 (Darker)
│  ├─ Box Shadow: 0 4px 12px rgba(196, 30, 58, 0.3)
│  └─ Transform: translateY(-1px)
├─ Active State:
│  ├─ Background: #8B1628
│  └─ Transform: translateY(0)
└─ Disabled State:
   ├─ Background: #CCCCCC
   ├─ Cursor: not-allowed
   └─ Opacity: 0.6
```

#### Secondary Button (Thao Tác Phụ)

```
Style:
├─ Background: Transparent
├─ Border: 2px solid #E5E7EB
├─ Text Color: #374151
├─ Padding: 10px 18px
├─ Border Radius: 8px
├─ Font Weight: 500
├─ Hover State:
│  ├─ Border Color: #C41E3A
│  └─ Text Color: #C41E3A
│  └─ Background: #FCEEF2 (Subtle Red BG)
└─ Active State:
   ├─ Border Color: #A81830
   └─ Text Color: #A81830
```

#### Icon Button (Compact)

```
Style:
├─ Width & Height: 40px
├─ Border Radius: 6px
├─ Display: flex | align-items: center | justify-content: center
├─ Background: #F9FAFB (On hover)
├─ Icon Size: 20px
└─ Transition: 0.2s ease-out
```

---

### 2. CARDS (Thẻ Thông Tin)

#### Data Card (Thẻ Dữ Liệu)

```
┌─────────────────────────────────┐
│ 📊 Total Reports                │
│                                 │
│            245                  │ ← Typography rõ ràng
│                                 │
│ ↑ 12.5% from last month         │
└─────────────────────────────────┘

Style:
├─ Background: #FFFFFF
├─ Border: 1px solid #E5E7EB
├─ Border Radius: 12px
├─ Padding: 20px-24px
├─ Box Shadow: 0 1px 3px rgba(0, 0, 0, 0.08)
├─ Hover Shadow: 0 4px 12px rgba(0, 0, 0, 0.12)
├─ Icon Color: #C41E3A (Primary Red)
└─ Transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)
```

#### Info Card (Thẻ Thông Tin Chi Tiết)

```
Style:
├─ Background: #F9FAFB
├─ Border Left: 4px solid #C41E3A
├─ Border Radius: 8px
├─ Padding: 16px-20px
├─ Typography: Category + Value + Subtitle
└─ Used for: Summary, Status, Metadata
```

#### State Cards (Thẻ Trạng Thái)

```
Success Card:  bg-#E8F5E9 | border-color #1F7E56
Warning Card:  bg-#FEF3C7 | border-color #F59E0B
Error Card:    bg-#FEE2E2 | border-color #DC2626
Info Card:     bg-#EBF2FB | border-color #2C5AA0
```

---

### 3. DATA TABLES (Bảng Dữ Liệu)

#### Table Structure

```
┌─────────────────────────────────────────────────────┐
│ 📋 Reports List                                     │
├─────────────────────────────────────────────────────┤
│ Name  │ Description │ Writer  │ Status │ Action    │ ← Header
├───────┼─────────────┼─────────┼────────┼───────────┤
│ ...   │ ...         │ ...     │ ✓      │ [Details] │
│ ...   │ ...         │ ...     │ ⏳     │ [Details] │
│ ...   │ ...         │ ...     │ ✓      │ [Details] │
└───────┴─────────────┴─────────┴────────┴───────────┘
```

#### Table Style Guide

```
Header Row:
├─ Background: #F3F4F6 (Light Gray-100)
├─ Text Color: #374151 (Gray-700)
├─ Font Weight: 600 (SemiBold)
├─ Font Size: 12px-13px
├─ Text Transform: Optional uppercase
├─ Padding: 12px-16px
├─ Border Bottom: 2px solid #E5E7EB
└─ Letter Spacing: 0.05em

Body Row:
├─ Background: #FFFFFF
├─ Text Color: #374151
├─ Font Size: 14px
├─ Padding: 16px
├─ Border Bottom: 1px solid #E5E7EB
├─ Hover Background: #F9FAFB
└─ Cursor: pointer (nếu interactive)

Alternating Rows (Optional):
├─ Alternate Background: #FAFAFA
└─ Makes scanning easier

Column Alignment:
├─ Text columns: left
├─ Numbers: right
├─ Status/Actions: center
└─ Dates: center
```

#### Status Badge Style

```
Success Badge:
├─ Background: #E8F5E9
├─ Text Color: #1F7E56
├─ Border Radius: 12px
├─ Padding: 4px 12px
├─ Font Size: 12px
├─ Font Weight: 500
└─ Icon: ✓ or checkmark

Warning Badge:
├─ Background: #FEF3C7
├─ Text Color: #92400E
└─ Icon: ⚠

Error Badge:
├─ Background: #FEE2E2
├─ Text Color: #991B1B
└─ Icon: ✕

Info Badge:
├─ Background: #EBF2FB
├─ Text Color: #1E3A8A
└─ Icon: ⓘ
```

---

### 4. SEARCH BAR & FILTERS

```
┌────────────────────────────────────────────────┐
│ 🔍 Search reports by name, technician...      │
└────────────────────────────────────────────────┘

Style:
├─ Background: #FFFFFF
├─ Border: 1px solid #E5E7EB
├─ Border Radius: 12px (Full rounded for organic feel)
├─ Padding: 12px 16px
├─ Icon Color: #9CA3AF (Gray-400)
├─ Placeholder Color: #9CA3AF
├─ Focus:
│  ├─ Border Color: #C41E3A
│  ├─ Box Shadow: 0 0 0 3px rgba(196, 30, 58, 0.1)
│  └─ Icon Color: #C41E3A
└─ Font Size: 14px
```

---

### 5. PAGINATION

```
Showing 5 out of 245 reports  « 1 2 3 4 5 »

Style:
├─ Active Page Button:
│  ├─ Background: #C41E3A
│  ├─ Text Color: #FFFFFF
│  ├─ Border Radius: 6px
│  └─ Font Weight: 500
├─ Inactive Page Button:
│  ├─ Background: #F3F4F6
│  ├─ Text Color: #374151
│  ├─ Hover Background: #E5E7EB
│  └─ Cursor: pointer
├─ Nav Button (« »):
│  ├─ Style: Same as inactive
│  ├─ Icon Size: 18px
│  └─ Padding: 8px 12px
└─ Spacing: 8px between buttons
```

---

### 6. MODALS & DIALOGS

```
┌──────────────────────────────────┐
│ Create New Report            [×] │ ← Header with close
├──────────────────────────────────┤
│                                  │
│  [Form Fields]                   │
│                                  │
│  ┌────────────┬────────────────┐ │
│  │  Cancel    │  Create Report │ │ ← Action Buttons
│  └────────────┴────────────────┘ │
└──────────────────────────────────┘

Style:
├─ Backdrop: rgba(0, 0, 0, 0.5)
├─ Modal Background: #FFFFFF
├─ Border Radius: 12px
├─ Box Shadow: 0 20px 25px rgba(0, 0, 0, 0.2)
├─ Max Width: 500px (Medium) / 700px (Large)
├─ Margin: Auto center
├─ Padding: 24px
├─ Header Font Size: 20px | Font Weight: 600
└─ Smooth animation: fadeIn + slideUp (0.3s ease)
```

---

## 🎯 SPACING & WHITESPACE SYSTEM (Pro Max)

```
8px Grid System (Following Material Design)
├─ 4px   (micro spacing)
├─ 8px   (xs)
├─ 12px  (sm)
├─ 16px  (md) ← Most common
├─ 20px  (lg)
├─ 24px  (xl) ← Section padding
├─ 32px  (2xl)
├─ 40px  (3xl)
└─ 48px  (4xl)

Main Content Padding (Pro Max = Generous):
├─ Horizontal: 32px (Desktop) | 24px (Tablet) | 16px (Mobile)
├─ Vertical: 24px between sections
└─ Creates breathing room (Key to "Pro Max" feel)
```

---

## 🌙 DARK MODE IMPLEMENTATION

```
Dark Mode Colors:
├─ Primary Accent: Slightly lighter (#E85D75 instead of #C41E3A)
├─ Background: #1A1A1A (Darker than typical #111 for elegance)
├─ Surface: #2D2D2D
├─ Text Primary: #F5F5F5
├─ Text Secondary: #A0A0A0
├─ Borders: #4D4D4D
└─ Shadows: rgba(0, 0, 0, 0.5) - More pronounced

Note: Maintain same contrast ratios (WCAG AA minimum 4.5:1)
```

---

## ⚡ ANIMATIONS & TRANSITIONS (Smooth & Professional)

```
Standard Transition Timing:
├─ Quick feedback: 0.15s ease-out (button hover)
├─ Normal interaction: 0.2s ease-out (modal open)
├─ Slow reveal: 0.3s ease-out (page load)
└─ Bezier Curve: cubic-bezier(0.4, 0, 0.2, 1)

Animations:
├─ Fade In:    opacity 0 → 1 (0.2s)
├─ Slide Up:   transform translateY(20px) → translateY(0) (0.2s)
├─ Scale:      transform scale(0.95) → scale(1) (0.15s)
└─ Bounce:     Subtle bounce on CTA hover

Avoid:
├─ Overly complex animations
├─ Long durations > 0.4s (except page transitions)
└─ Spinning/rotating loaders (use pulsing instead)
```

---

## 🎨 VISUAL HIERARCHY BEST PRACTICES

1. **Color Contrast**: Primary Red (#C41E3A) stands out but stays elegant
2. **Size Differentiation**: H1 > H2 > H3 (Clear visual separation)
3. **White Space**: 60% white space in cards (Pro Max approach)
4. **Icon Usage**:
   - Status indicators: checkmark (✓), warning (⚠), error (✕)
   - Use color + shape for quick recognition
   - Icon size: 16-20px (inline) | 24-32px (standalone)

---

## ✅ WCAG Accessibility Checklist

- [ ] Minimum contrast ratio: 4.5:1 (normal text), 3:1 (large text)
- [ ] Focus indicators: Clear 2px outline (#C41E3A)
- [ ] Keyboard navigation: Tab order logical
- [ ] Screen reader: Proper semantic HTML (button, link, etc.)
- [ ] Color not only cue: Also use icons, text, patterns
- [ ] Touch targets: Minimum 44×44px for mobile buttons

---

## 📋 SUMMARY: Orchid Lab Color Palette (Copy-Paste)

```json
{
  "colors": {
    "primary": {
      "DEFAULT": "#C41E3A",
      "light": "#E85D75",
      "lighter": "#F5D0DB",
      "pale": "#FCEEF2"
    },
    "success": "#1F7E56",
    "warning": "#F59E0B",
    "error": "#DC2626",
    "info": "#2C5AA0",
    "neutral": {
      "50": "#F9FAFB",
      "100": "#F3F4F6",
      "200": "#E5E7EB",
      "400": "#9CA3AF",
      "500": "#6B7280",
      "700": "#374151",
      "900": "#1F2937"
    }
  },
  "borderRadius": {
    "sm": "6px",
    "md": "8px",
    "lg": "12px",
    "full": "50%"
  },
  "shadows": {
    "sm": "0 1px 3px rgba(0, 0, 0, 0.08)",
    "md": "0 4px 12px rgba(0, 0, 0, 0.12)",
    "lg": "0 20px 25px rgba(0, 0, 0, 0.2)"
  }
}
```

---

**Design Document Version**: 1.0 | Orchid Lab Pro Max Edition  
**Last Updated**: April 2026  
**Status**: Ready for Implementation
