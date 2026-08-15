---
name: Soft Lab
colors:
  surface: '#faf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#faf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f4f0'
  surface-container: '#efeeea'
  surface-container-high: '#e9e8e4'
  surface-container-highest: '#e3e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#404946'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ed'
  outline: '#707976'
  outline-variant: '#bfc9c5'
  surface-tint: '#2e685d'
  primary: '#004339'
  on-primary: '#ffffff'
  primary-container: '#1f5b50'
  on-primary-container: '#96d1c2'
  inverse-primary: '#97d2c4'
  secondary: '#4d635a'
  on-secondary: '#ffffff'
  secondary-container: '#cfe8dc'
  on-secondary-container: '#536960'
  tertiary: '#3d2d7b'
  on-tertiary: '#ffffff'
  tertiary-container: '#544594'
  on-tertiary-container: '#c9bcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b3eee0'
  primary-fixed-dim: '#97d2c4'
  on-primary-fixed: '#00201b'
  on-primary-fixed-variant: '#105045'
  secondary-fixed: '#cfe8dc'
  secondary-fixed-dim: '#b3ccc1'
  on-secondary-fixed: '#091f18'
  on-secondary-fixed-variant: '#354b43'
  tertiary-fixed: '#e6deff'
  tertiary-fixed-dim: '#cbbeff'
  on-tertiary-fixed: '#1d045c'
  on-tertiary-fixed-variant: '#493a89'
  background: '#faf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e3e2df'
  graphite: '#202026'
  pure-white: '#FFFFFF'
  glass-overlay: rgba(255, 255, 255, 0.7)
typography:
  display-hero:
    fontFamily: Source Serif 4
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  display-hero-mobile:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-main: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  safe-area-bottom: 34px
---

## Brand & Style

This design system embodies the "Soft Lab" narrative—a sophisticated intersection of clinical precision and lifestyle wellness. Designed for a young female demographic, the aesthetic moves away from sterile medical tropes toward a high-end skincare editorial feel. 

The visual style is **Corporate / Modern** with a **Minimalist** foundation, utilizing generous whitespace and organic tones to evoke "trustworthy friendliness." It prioritizes clarity and scientific reliability without sacrificing the warmth of a personal beauty diary. The mood is calm, professional, and encouraging, focusing on progress and skin health rather than perfection.

## Colors

The palette is rooted in nature and science. **Warm Ivory** serves as the primary canvas, providing a softer, more premium alternative to stark white. **Deep Green** is the workhorse for typography and primary actions, ensuring high legibility and a sense of "botanical authority."

**Soft Mint** acts as the brand’s signature accent for progress and positive reinforcement, while **Lavender** is reserved exclusively for AI-driven insights and technical scanning features. This distinction helps users mentally categorize "human" vs "algorithmic" feedback. **Graphite** provides depth for metadata and secondary text, avoiding the harshness of pure black.

## Typography

The typography strategy employs an editorial pairing. **Source Serif 4** is used for high-level headings and quotes to mimic the feel of a luxury skincare magazine. This adds a layer of sophistication and "lifestyle" appeal.

**Hanken Grotesk** handles the functional heavy lifting. Its sharp, contemporary geometry ensures clinical legibility across charts, survey questions, and technical data. For mobile interfaces, display sizes scale down to maintain a balanced hierarchy within the narrow iPhone viewport. Use `label-bold` for all button text and navigation items to ensure clear affordance.

## Layout & Spacing

The design system uses a **fixed grid** model optimized for iPhone. The layout is centered around a 24px side margin to create "breathable" whitespace, reinforcing the premium feel.

Vertical layout relies on a strict 8px rhythmic stack. Elements are grouped in logical cards, separated by `stack-lg` to prevent visual clutter. The "Hero" area typically houses portrait photography or the skin score, utilizing a centered alignment to maintain focus. Navigation uses the standard iOS bottom safe area, while camera interfaces utilize full-screen layouts with specific 16px padding for floating controls.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Ambient Shadows**. 

1.  **Base Layer:** The Warm Ivory background (`#F7F6F2`) acts as the foundation.
2.  **Surface Layer:** Primary content sits on Pure White (`#FFFFFF`) cards. These cards use a very soft, diffused shadow (15% opacity, 20px blur, 4px Y-offset) with a slight Deep Green tint to keep the depth feeling natural rather than "techy."
3.  **Overlay Layer:** Camera controls and modal backgrounds use **Glassmorphism**. High backdrop blur (20px) and a semi-transparent white tint allow the underlying skin texture to remain visible while providing a clear functional surface.

Avoid heavy borders; use subtle shifts in surface color or very thin (0.5pt) light-gray strokes to define boundaries.

## Shapes

The shape language is characterized by "Soft Lab" geometry. Large corner radii (24px to 28px) are used for primary content cards and image containers to create an approachable, gentle silhouette.

Interactive elements like buttons and chips use **Pill-shaped** (fully rounded) geometry to signal high interactability. Facial alignment guides in the camera interface use thin, continuous ovals to provide a clinical guide that feels soft and non-intimidating.

## Components

### Buttons & Chips
- **Primary Button:** Large, pill-shaped, Deep Green fill with Pure White text.
- **AI Action:** Lavender fill with Graphite or White text, used exclusively for scanning or AI-analysis.
- **Selection Chips:** Pill-shaped, Soft Mint background when active, Warm Ivory when inactive.

### Cards
- **Insight Cards:** Pure White base with a 24px radius and soft ambient shadow. 
- **Metric Cards:** Small white tiles for specific factors (e.g., "Pores", "Hydration") with a centered label and bold Deep Green value.

### Inputs & Selection
- **Survey Selectors:** Large white cards that highlight with a Soft Mint border and checkmark upon selection.
- **Vertical Split Slider:** A signature component with a thin Graphite handle, allowing users to scrub between "Day 1" and "Today" photos.

### Data Visualization
- **Skin Score Ring:** A circular progress indicator using Soft Mint for the value and a light-green track.
- **Region Heatmaps:** Semi-transparent Soft Mint overlays on skin photos to highlight areas of improvement.