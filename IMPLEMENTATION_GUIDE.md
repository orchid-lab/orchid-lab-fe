<!-- ORCHID LAB - Design System Implementation Guide for Developers -->

# 🚀 ORCHID LAB Design System - Implementation Guide

> **Hướng dẫn chi tiết cách áp dụng Orchid Lab Design cho các trang admin khác**

---

## 📋 Quick Reference

### Files Created
✅ `src/pages/admin/report/AdminReports.tsx` - Refactored with new design  
✅ `src/styles/orchid-components.css` - Reusable CSS components  
✅ `ORCHID_LAB_DESIGN_SYSTEM.md` - Complete design documentation  
✅ `REFACTOR_SUMMARY.md` - Before/after comparison  

### Color Hex Codes (Copy-Paste Ready)
```
Primary Red:     #A4161A (Ruby - brand color)
Accent Red:      #D62828 (Rich - hover/active)
Light Red:       #F8D7DA (Background tint)
Premium Bg:      #F8F7F2 (Orchid white)
Pure White:      #FFFFFF (Cards)
Dark Text:       #1A1A1A (Primary text)
Muted Gray:      #6B7280 (Secondary text)
Light Border:    #E5E7EB (Dividers)
Ultra Light:     #F3F4F6 (Subtleties)
```

---

## 🎯 Step-by-Step Implementation

### STEP 1: Enable Orchid Components CSS (ONE-TIME SETUP)

**File**: `src/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/orchid-components.css'  // ✅ ADD THIS LINE
import './i18n.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

### STEP 2: Apply to Admin Dashboard Page

**File**: `src/pages/admin/dashboard/DashboardAdmin.tsx`

**BEFORE** (Current style):
```jsx
export default function DashboardAdmin() {
  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100">
      <div className="p-4">
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-100 rounded p-4">
            <div className="text-green-800">Total Items</div>
            <div className="text-2xl font-bold">123</div>
          </div>
        </div>
      </div>
    </main>
  )
}
```

**AFTER** (Orchid style):
```jsx
export default function DashboardAdmin() {
  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] orchid-page-bg">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <h1 className="orchid-h1 mb-2">Dashboard</h1>
        <div className="orchid-title-accent mb-8"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="orchid-metric-card orchid-metric-card-primary">
            <div className="orchid-metric-label">Total Items</div>
            <div className="orchid-metric-value">123</div>
            <div className="orchid-metric-icon">📊</div>
          </div>
        </div>
      </div>
    </main>
  )
}
```

**Key Changes:**
- ✅ `bg-gray-100` → `orchid-page-bg` (gradient background)
- ✅ `p-4` → `px-8 py-8` (generous spacing)
- ✅ `text-green-800` → `orchid-h1` (typography class)
- ✅ Summary cards → `orchid-metric-card` (new style)

---

### STEP 3: Apply to List/Table Pages

**File**: `src/pages/admin/element/AdminElement.tsx` (Example)

**BEFORE**:
```jsx
<div className="bg-white rounded shadow overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="bg-green-50">
        <th className="p-3 text-green-800">Name</th>
        <th className="p-3 text-green-800">Type</th>
      </tr>
    </thead>
    <tbody>
      {items.map(item => (
        <tr key={item.id} className="border-t hover:bg-green-50">
          <td className="p-3">{item.name}</td>
          <button className="border border-green-800 text-green-800 px-3 py-1">
            Edit
          </button>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**AFTER**:
```jsx
<div className="orchid-container overflow-x-auto">
  <table className="orchid-table">
    <thead>
      <tr className="orchid-table-header">
        <th className="orchid-table-header-cell">Name</th>
        <th className="orchid-table-header-cell">Type</th>
      </tr>
    </thead>
    <tbody>
      {items.map(item => (
        <tr key={item.id} className="orchid-table-body-row">
          <td className="orchid-table-body-cell font-medium">{item.name}</td>
          <button className="orchid-btn-primary">
            Edit
          </button>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Key Changes:**
- ✅ Container: `bg-white rounded shadow` → `orchid-container`
- ✅ Table wrapper: `orchid-table` class
- ✅ Table header: `bg-green-50` → `orchid-table-header`
- ✅ Table cells: `orchid-table-header-cell`, `orchid-table-body-cell`
- ✅ Buttons: Full button classes → `orchid-btn-primary`

---

### STEP 4: Apply to Forms

**File**: `src/pages/admin/config/AdminConfig.tsx` (Example)

**BEFORE**:
```jsx
<form className="bg-white rounded shadow p-6">
  <h2 className="text-2xl font-semibold text-green-800 mb-4">Settings</h2>
  
  <div className="mb-4">
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Name
    </label>
    <input 
      type="text"
      className="w-full border border-gray-300 rounded px-3 py-2"
    />
  </div>
  
  <button className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
    Save
  </button>
</form>
```

**AFTER**:
```jsx
<form className="orchid-container max-w-2xl">
  <h2 className="orchid-h2 mb-6">Settings</h2>
  
  <div className="orchid-form-group">
    <label className="orchid-form-label">Name</label>
    <input 
      type="text"
      className="orchid-input"
    />
  </div>
  
  <button className="orchid-btn-primary">
    Save
  </button>
</form>
```

**Key Changes:**
- ✅ Form container: `orchid-container`
- ✅ Form labels: `orchid-form-label`
- ✅ Form group spacing: `orchid-form-group`
- ✅ Inputs: `orchid-input` (consistent styling)
- ✅ Buttons: `orchid-btn-primary`

---

### STEP 5: Search/Filter Bars (Most Common)

**BEFORE**:
```jsx
<div className="flex gap-2 mb-4">
  <div className="flex-1 relative">
    <input
      type="text"
      placeholder="Search..."
      className="w-full border border-gray-300 rounded-full px-4 py-2 pl-10"
    />
    <span className="absolute left-3 top-2.5 text-gray-400">
      <SearchIcon />
    </span>
  </div>
</div>
```

**AFTER**:
```jsx
<div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-700 mb-6">
  <label className="orchid-label mb-4 block">Search</label>
  <div className="orchid-search-wrapper">
    <input
      type="text"
      placeholder="Search..."
      className="orchid-search-input"
    />
    <span className="orchid-search-icon">
      <SearchIcon />
    </span>
  </div>
</div>
```

**Key Changes:**
- ✅ Wrapper: Add card container with left accent border
- ✅ Input: Use `orchid-search-input` class
- ✅ Icon position: Use `orchid-search-icon` class

---

## 🎨 Color Replacement Cheatsheet

When you see these OLD colors, replace with NEW:

| OLD Pattern | NEW Replacement |
|------------|-----------------|
| `text-green-700` | `text-red-700` or `text-stone-900` |
| `text-green-800` | `text-red-700` or use class like `orchid-h1` |
| `bg-green-50` | `bg-stone-50` or use container class |
| `bg-green-100` | `bg-stone-100` or card class |
| `border-green-800` | `border-red-700` |
| `hover:bg-green-700` | `hover:bg-red-700` |
| `hover:text-white` | Keep as-is |
| `bg-gray-100` | `orchid-page-bg` or `bg-stone-100` |
| `border-gray-300` | `border-stone-200` |
| `text-gray-600` | `text-stone-600` |
| `text-gray-400` | `text-stone-400` |

---

## 📊 Status Badges Pattern

For any status indicators, use semantic badges:

```jsx
// ✅ Success/Approved
<span className="orchid-badge-success">Approved</span>

// ⚠️ Warning/Pending
<span className="orchid-badge-warning">Pending</span>

// ❌ Error/Rejected
<span className="orchid-badge-error">Rejected</span>

// ℹ️ Info
<span className="orchid-badge-info">Info</span>
```

---

## 🔄 Common Component Patterns

### Loading State
```jsx
<tr key={`skeleton-${i}`} className="border-b border-stone-100 animate-pulse">
  <td className="py-4 px-6">
    <div className="orchid-skeleton-text"></div>
  </td>
</tr>
```

### Empty State
```jsx
<div className="text-center py-12">
  <p className="text-lg font-medium text-stone-900">No data found</p>
  <p className="text-sm text-stone-600 mt-1">Start by creating a new item</p>
</div>
```

### Modal Dialog
```jsx
<div className="orchid-modal-backdrop">
  <div className="orchid-modal">
    <div className="orchid-modal-header">
      <h2 className="orchid-h2">Title</h2>
    </div>
    <div className="orchid-modal-body">
      {/* Content */}
    </div>
    <div className="orchid-modal-footer">
      <button className="orchid-btn-secondary">Cancel</button>
      <button className="orchid-btn-primary">Save</button>
    </div>
  </div>
</div>
```

### Alert/Notification
```jsx
<div className="bg-stone-50 border-l-4 border-red-700 rounded-lg p-4">
  <p className="font-semibold text-stone-900">Alert Title</p>
  <p className="text-sm text-stone-600 mt-1">Alert message here</p>
</div>
```

---

## ✅ Refactor Checklist

Use this checklist when refactoring each page:

- [ ] Import `orchid-components.css` once in main.tsx
- [ ] Change page background to `orchid-page-bg`
- [ ] Add max-width container and padding
- [ ] Update typography to use `orchid-h1`, `orchid-h2`, etc.
- [ ] Add title accent bar (`.orchid-title-accent`)
- [ ] Replace all green colors with red/stone equivalents
- [ ] Update containers to use `.orchid-container`
- [ ] Update tables to use `.orchid-table-*` classes
- [ ] Update buttons to use `.orchid-btn-*` classes
- [ ] Update badges/status to use `.orchid-badge-*` classes
- [ ] Update forms to use `.orchid-form-*` classes
- [ ] Add metric cards where relevant (`.orchid-metric-card`)
- [ ] Update pagination styling
- [ ] Test hover states and transitions
- [ ] Verify spacing looks >= Pro Max (generous)
- [ ] Check accessibility (contrast, focus states)

---

## 🎯 Priority Pages to Refactor

### High Priority (Most Used)
1. ✅ `/admin/report` - **DONE**
2. `/admin/task` - Tasks management
3. `/admin/element` - Chemical/Material elements
4. `/admin/method` - Lab methods

### Medium Priority
5. `/admin/dashboard` - Main dashboard
6. `/admin/config` - Settings/configuration
7. `/admin/experimentlog` - Experiment logs
8. `/admin/method` - Method details

### Low Priority (Less Frequent)
9. `/researcher/*` - Researcher pages
10. `/technician/*` - Technician pages

---

## 🔧 Tailwind Utility Classes Reference

When NOT using component classes, use these Tailwind patterns:

```jsx
// Spacing (Generous!)
<div className="px-8 py-8 md:px-12 md:py-12">

// Typography
<h1 className="text-3xl font-bold text-stone-900 tracking-tight">Title</h1>
<p className="text-base font-normal text-stone-900 leading-relaxed">Body</p>
<span className="text-sm font-normal text-stone-600">Muted</span>

// Borders & Radius
<div className="border-2 border-stone-200 rounded-xl shadow-md">

// Transitions
<button className="transition-all duration-200 hover:bg-red-700">

// Flexbox Layouts
<div className="flex items-center justify-between gap-6">

// Grid Layouts
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

// States
className={`${active ? 'bg-red-700 text-white' : 'bg-stone-100 text-stone-700'}`}
```

---

## 🚨 Common Mistakes to Avoid

❌ **DON'T** - Use inline styles
```jsx
<div style={{ backgroundColor: 'green' }}>  // Wrong!
```

✅ **DO** - Use Tailwind classes
```jsx
<div className="bg-red-700">  // Correct!
```

---

❌ **DON'T** - Mix green and red colors
```jsx
<button className="bg-green-700 hover:bg-red-700">  // Inconsistent!
```

✅ **DO** - Keep consistent color scheme
```jsx
<button className="border-2 border-red-700 text-red-700 hover:bg-red-700 hover:text-white">
```

---

❌ **DON'T** - Use minimal spacing
```jsx
<div className="p-2">  // Too tight!
```

✅ **DO** - Embrace whitespace (Pro Max)
```jsx
<div className="px-8 py-8">  // Generous!
```

---

❌ **DON'T** - Forget transitions
```jsx
<button className="hover:bg-red-700">  // Jumpy!
```

✅ **DO** - Add smooth transitions
```jsx
<button className="hover:bg-red-700 transition-all duration-200">  // Smooth!
```

---

## 📞 Quick Support

### Q: Can I use both old and new styles?
**A:** Yes! Transition gradually. New styles don't override old, so pages can coexist during migration.

### Q: Do I need to change components structure?
**A:** No! Keep all JSX structure. Only change:
- CSS class names
- Color values (green → red/stone)
- Container styling

### Q: What if my page uses custom colors?
**A:** Check `ORCHID_LAB_DESIGN_SYSTEM.md` for all approved colors. If you need custom, add to `orchid-components.css` with `.orchid-custom-*` naming.

### Q: How do I debug styling issues?
**A:** 
1. Check `REFACTOR_SUMMARY.md` for before/after examples
2. Compare with `AdminReports.tsx` (already refactored)
3. Verify you imported `orchid-components.css`
4. Use browser DevTools to inspect classes

---

## 🎉 You're Ready!

Start with Step 1 (one-time setup), then apply Steps 2-5 to each admin page systematically.

**Estimated time per page**: 30-45 minutes  
**Total refactor time**: ~4-6 hours for all admin pages

Good luck! 🚀

---

*Reference Version: 1.0*  
*Last Updated: April 2026*
