# UPI Help Site - Design Theme Analysis

**Source:** https://www.upihelp.npci.org.in/
**Date Captured:** 2026-04-10
**Description:** NPCI UPI Help Portal - Digital Payments Q&A, Mandate Management & Grievance Redressal

---

## 1. Color Palette

### Primary Colors

| Name        | Hex Code  | Usage                              |
| ----------- | --------- | ---------------------------------- |
| Deep Blue   | `#1A237E` | Header background, primary buttons |
| Dark Navy   | `#0D1442` | Sidebar background                 |
| Bright Cyan | `#00BCD4` | Accent highlights, icons           |
| Teal        | `#00838F` | Secondary accents                  |

### Neutral Colors

| Name        | Hex Code  | Usage                                 |
| ----------- | --------- | ------------------------------------- |
| White       | `#FFFFFF` | Main content background, text on dark |
| Light Gray  | `#F5F5F5` | Card backgrounds, input fields        |
| Medium Gray | `#9E9E9E` | Placeholder text, secondary text      |
| Dark Gray   | `#424242` | Body text                             |

### Status Colors

| Name           | Hex Code  | Usage                    |
| -------------- | --------- | ------------------------ |
| Success Green  | `#4CAF50` | Active status indicators |
| Warning Orange | `#FF9800` | Alert elements           |
| Error Red      | `#F44336` | Error states             |

---

## 2. Typography

### Font Families

- **Primary Font:** Inter, system-ui, sans-serif
- **Headings:** Bold weight, dark navy color (#0D1442)
- **Body Text:** Regular weight, dark gray (#424242)

### Font Sizes

| Element         | Size | Weight |
| --------------- | ---- | ------ |
| Page Heading    | 24px | 700    |
| Section Heading | 18px | 600    |
| Card Title      | 16px | 600    |
| Body Text       | 14px | 400    |
| Small/Caption   | 12px | 400    |

---

## 3. Layout Structure

### Overall Layout

- **Type:** Sidebar + Main Content (2-column layout)
- **Sidebar Width:** ~280px fixed
- **Content Area:** Fluid, max-width ~800px

### Header

- Height: 60px
- Background: Deep Blue (#1A237E)
- Contains: NPCI Logo, Search bar

### Sidebar (Left Panel)

- Background: Dark Navy (#0D1442)
- Width: 280px
- Sections:
  - Search chats
  - New chat button
  - Chat history list
  - Quick links (Complaints, Logout)
- Text color: White/Light gray

### Main Content Area

- Background: White (#FFFFFF)
- Padding: 24px
- Sections:
  - Quick action buttons grid
  - UPI Info card
  - Autopay Mandates section

---

## 4. UI Components

### Quick Action Buttons

- **Layout:** 2x2 grid
- **Background:** Light gray cards (#F5F5F5)
- **Border Radius:** 12px
- **Icon Size:** 48px
- **States:** Hover - slight elevation/shadow

| Button            | Icon | Label             |
| ----------------- | ---- | ----------------- |
| Transaction Issue | ⚡   | UPI Related Issue |
| Forgot PIN        | 🔒   | Forgot UPI PIN?   |
| Fraud Awareness   | 🛡️   | Fraud Awareness   |
| Default UPI Id    | 💳   | Default UPI Id    |

### Info Cards

- **Background:** White with subtle border
- **Border:** 1px solid #E0E0E0
- **Border Radius:** 8px
- **Padding:** 16px
- **Shadow:** 0 2px 4px rgba(0,0,0,0.1)

### Autopay Mandate Cards

- **Background:** Light gray (#F5F5F5)
- **Border Radius:** 12px
- **Layout:** Horizontal card with logo, details, actions
- **Status Badge:** Green dot + "Active" text
- **Actions:** Pause (outline), Cancel (outline) buttons

### Form Elements

- **Input Fields:**
  - Background: White
  - Border: 1px solid #E0E0E0
  - Border Radius: 8px
  - Padding: 12px 16px
  - Focus: Cyan (#00BCD4) border

- **Buttons:**
  - Primary: Deep Blue background, white text
  - Secondary: White background, blue text, blue border
  - Border Radius: 8px
  - Padding: 12px 24px

### Checkbox

- Unchecked: White background, gray border
- Checked: Cyan (#00BCD4) background, white checkmark

---

## 5. Visual Effects

### Shadows

- Card shadow: `0 2px 4px rgba(0,0,0,0.1)`
- Hover shadow: `0 4px 8px rgba(0,0,0,0.15)`

### Animations

- Button hover: 0.2s ease transition
- Page transitions: Fade in/out

### Icons

- Style: Outlined/Line icons
- Color: Matching text color or accent cyan

---

## 6. Spacing System

| Element        | Spacing   |
| -------------- | --------- |
| Section Gap    | 24px      |
| Card Padding   | 16px      |
| Button Padding | 12px 24px |
| Input Padding  | 12px 16px |
| Icon Margin    | 8px       |

---

## 7. Responsive Breakpoints

Based on observed layout:

- **Desktop:** > 1024px (full 2-column)
- **Tablet:** 768px - 1024px (collapsed sidebar)
- **Mobile:** < 768px (stacked layout, hamburger menu)

---

## 8. Brand Elements

### Logo

- **Text:** "NPCI" (National Payments Corporation of India)
- **Tagline:** "Simplify • Resolve • Inform"
- **Favicon:** Blue square with white "N" or similar

### Footer

- Links: Terms of use, Privacy policy, Disclaimer, FAQs
- Copyright: "© 2025 NPCI. All rights reserved"

---

## 9. Key Screenshots

[See browser screenshot for visual reference]

---

## 10. Design Summary

**Overall Aesthetic:** Professional, clean, government-tech feel

**Vibe:**

- Trustworthy and secure
- Simple and accessible
- Function-first approach
- Minimal animations
- Clear visual hierarchy

**Similar To:**

- Banking portals (SBI, HDFC)
- Government service portals
- Customer support dashboards

---

_Generated from visual analysis of upihelp.npci.org.in_
