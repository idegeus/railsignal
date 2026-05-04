---
name: Mediterranean Transit
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#5e3f3b'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#936e69'
  outline-variant: '#e9bcb6'
  surface-tint: '#c0000c'
  primary: '#b5000b'
  on-primary: '#ffffff'
  primary-container: '#e30613'
  on-primary-container: '#fff5f3'
  inverse-primary: '#ffb4aa'
  secondary: '#705d00'
  on-secondary: '#ffffff'
  secondary-container: '#fcd400'
  on-secondary-container: '#6e5c00'
  tertiary: '#a3245e'
  on-tertiary: '#ffffff'
  tertiary-container: '#c33f77'
  on-tertiary-container: '#fff4f5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930007'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#ffd9e3'
  tertiary-fixed-dim: '#ffb0c9'
  on-tertiary-fixed: '#3e001e'
  on-tertiary-fixed-variant: '#8b0b4c'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  h1:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin: 32px
  container-max: 1280px
---

## Brand & Style

This design system balances the institutional reliability of modern transit with the vibrant, cultural energy of Catalan aesthetics. It is designed for a professional, efficient, and welcoming travel experience.

The style is **Corporate / Modern** with a distinct editorial flair. It utilizes high-contrast layout structures and a "functional-first" approach to information density. The visual language favors structural integrity over decorative effects, ensuring that scheduling and wayfinding data remain the primary focus. Surfaces are kept pristine and white to allow the high-saturation accent colors to guide the user's eye toward critical actions and journey milestones.

## Colors

The palette is rooted in the Catalan flag and Renfe's heritage. 
- **Bright White (#FFFFFF)**: The foundation for all UI surfaces, ensuring a sense of cleanliness and clarity.
- **Vibrant Red (#E30613)**: Used for primary calls to action, brand-critical headers, and urgent notifications.
- **Catalan Yellow (#FFD700)**: Used as a secondary highlight for sub-navigation, progress markers, and attention-grabbing tags.
- **Deep Purple (#8A0A4B)**: Used sparingly for secondary brand accents and premium service tiers, mirroring Renfe's "Preferente" styling.
- **Neutral Greys**: Used for borders (#E0E0E0) and secondary text (#555555) to maintain high legibility without distracting from the brand colors.

## Typography

This design system uses **Inter** for its utilitarian precision and exceptional readability at small sizes—essential for complex transit schedules. 

Headlines are set with tight tracking and heavy weights to command authority. Information labels use all-caps and increased letter spacing to differentiate metadata from body content. For navigational links, a semi-bold weight is used to ensure they stand out against white backgrounds.

## Layout & Spacing

The layout follows a **Fixed Grid** model for desktop, centered on a 12-column system. On mobile, it transitions to a fluid model with a 16px safety margin.

A strict 4px baseline grid ensures vertical rhythm. Spacing is generous around brand imagery but dense within utility cards (like search results or ticket details) to reduce the need for excessive scrolling. Section headers should always be preceded by a minimum of 48px of whitespace to provide clear visual separation between journey stages.

## Elevation & Depth

This design system uses **Tonal Layers** and **Low-contrast outlines** instead of heavy shadows. 

- **Primary Level**: The main page background is always #FFFFFF.
- **Secondary Level**: Cards and search containers use a subtle #F5F5F5 background or a 1px border (#E0E0E0) to define boundaries.
- **Interactions**: On hover, elements may gain a subtle, crisp shadow (4px blur, 10% opacity) to indicate interactivity, but the default state is flat to mimic the clean aesthetic of modern high-speed rail stations.

## Shapes

The shape language is primarily **Soft (4px - 8px radius)**. 

While the overall vibe is sharp and professional, a subtle rounding of corners on cards and buttons prevents the UI from feeling overly clinical or dated. Buttons use a 4px radius for a "precision-engineered" look, while large image containers and content cards can go up to 8px to soften the photography. Status indicators (dots/chips) are the only elements that use a full-pill radius.

## Components

- **Buttons**: Primary buttons are solid Vibrant Red (#E30613) with white text. Secondary buttons use a white background with a Red border.
- **Search Bar**: A prominent white container with a 1px #E0E0E0 border, using Catalan Yellow (#FFD700) for the active focus state or search trigger.
- **Status Indicators**: Signal strength or seat availability icons use the traffic-light system: 
    - Green (#2D8A2D) for "Available/High"
    - Yellow (#FFD700) for "Limited/Fair"
    - Red (#E30613) for "Sold Out/None"
- **Lists**: Wayfinding lists (stations, stops) use a vertical line connecting bullet points, mimicking a transit map, with the active station highlighted in Red.
- **Cards**: Travel cards use a high-contrast layout with a large, bold price point and a clear "Buy" action.
- **Navigation**: The top header is clean white with a Red underline indicator for the active page, ensuring the branding is present but not overwhelming.