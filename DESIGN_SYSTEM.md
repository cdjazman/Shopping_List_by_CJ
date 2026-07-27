# Shopping List by CJ Design System

Version:
Project Orange

---

# Brand Identity

Shopping List by CJ is a modern, premium, friendly, organised and fast application for Australian shoppers.

The brand should feel confident, calm and useful.

The product should feel practical first and polished second.

---

# Logo

The existing logo remains unchanged.

The app icon should be:

- An orange rounded square
- Black glasses only
- No text

The icon must remain simple and recognisable.

---

# Typography

## Primary Font

Montserrat

Montserrat is the standard font for the entire application.

Never mix font families.

## Font Weights

- 400 Regular
- 500 Medium
- 600 SemiBold
- 700 Bold

## Recommended Sizes

- Display: 32px / 700
- Heading: 24px / 700
- Subheading: 18px / 600
- Body: 16px / 400
- Caption: 13px / 400
- Button: 15px / 600

All text should remain clear, readable and consistent across screens.

---

# Colour System

## Design Tokens

- Primary Orange: #FF6600
- Primary Background: #121212
- Secondary Background: #1E1E1E
- Card Surface: #1E1E1E
- Border: rgba(255, 255, 255, 0.10)
- Primary Text: #FFFFFF
- Secondary Text: #B0B0B0
- Success: #4CAF50
- Warning: #FFB300
- Error: #E53935

These tokens should be used consistently across all UI work.

---

# Themes

## Dark Mode

Dark mode is the default.

Every screen should be designed in dark mode first.

## Light Mode

Light mode will be introduced later.

It should be derived from the dark mode system so that both themes remain visually consistent apart from colour.

---

# Spacing System

Use an 8-point grid.

## Recommended Spacing Values

- 8px
- 12px
- 16px
- 20px
- 24px
- 32px
- 40px
- 48px

## Padding

Use consistent internal spacing for all cards, buttons and rows.

## Margins

Use consistent vertical and horizontal spacing between sections and components.

---

# Corner Radius

Use rounded surfaces throughout the experience.

## Recommended Radius Values

- Cards: 20px to 24px
- Buttons: 16px to 20px
- Dialogs: 24px
- Bottom Sheets: 24px
- FAB: 50%

---

# Shadows

Shadows should be subtle only.

Use soft elevation for cards and surfaces.

Do not use heavy shadows, glow effects or glassmorphism.

---

# Component Library

All UI elements should be reusable and consistent.

## List Card

Purpose: Represent a shopping list entry on the home screen.

Contains:

- Icon
- List name
- Item count
- Estimated total
- Budget
- Last used
- Chevron

## Shopping Item

Purpose: Represent a product inside a shopping list.

Contains:

- Checkbox
- Name
- Notes
- Preferred store
- Estimated price
- Optional image

## Budget Card

Purpose: Show the current shopping context and budget awareness.

Displays:

- Item count
- Estimated total
- Budget
- Remaining budget

## Store Filter Chip

Purpose: Filter the current shopping list by the store the user is shopping at.

These are not price comparison tabs.

They filter items by the location the user is currently shopping.

Available filters:

- All Stores
- Aldi
- Coles
- Woolworths

## Button

Purpose: Trigger primary or secondary actions.

Buttons should be large, clear and easy to tap.

## Search Bar

Purpose: Support quick product discovery and list lookup.

## FAB

Purpose: Provide a clear primary action for creating or adding something new.

## Bottom Navigation

Purpose: Provide primary navigation between Lists, Catalogue and Settings.

## Dialog

Purpose: Confirm important actions or communicate state clearly.

## Settings Row

Purpose: Group settings into clear, consistent rows.

## Category Chip

Purpose: Represent categories such as produce, dairy or pantry.

## Text Field

Purpose: Collect user input for names, notes, quantities and search terms.

---

# Navigation

## Bottom Navigation

The application should use bottom navigation with three primary destinations:

- Lists
- Catalogue
- Settings

Navigation should feel simple, predictable and consistent.

---

# Shopping List Cards

Every list card should contain:

- Icon
- Name
- Item count
- Estimated total
- Budget
- Last used
- Chevron

Cards should be easy to scan and easy to tap.

---

# Shopping Items

Every shopping row should contain:

- Checkbox
- Name
- Notes
- Preferred store
- Estimated price
- Optional image

The layout should remain concise and readable.

---

# Store Filter Chips

Store filter chips are used to refine the current shopping experience based on where the user is shopping.

They should not be styled as price comparison tools.

They should remain simple and practical.

Available filters:

- All Stores
- Aldi
- Coles
- Woolworths

The estimated total should update based on the selected store filter.

---

# Budget Card

The budget card should display:

- Item count
- Estimated total
- Budget
- Remaining budget

Budgeting supports shopping rather than replacing it.

---

# Motion

Animations should be:

- Fast
- Subtle
- Purposeful
- Never distracting

Motion should support clarity rather than attract attention.

---

# Accessibility

The design must support accessibility from the beginning.

## Requirements

- Minimum touch targets of 44x44px
- Strong colour contrast
- Font scaling support
- Keyboard accessibility
- Screen reader support

---

# Design Philosophy

Every screen should answer its purpose within three seconds.

Every component should be reusable.

Avoid one-off styling.

Maintain visual consistency throughout the application.

This document is the permanent source of truth for all future UI work.
