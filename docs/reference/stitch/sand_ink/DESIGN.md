---
name: Sand & Ink
colors:
  surface: '#fff8f3'
  surface-dim: '#dfd9d4'
  surface-bright: '#fff8f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f2ed'
  surface-container: '#f3ede7'
  surface-container-high: '#ede7e2'
  surface-container-highest: '#e7e1dc'
  on-surface: '#1d1b18'
  on-surface-variant: '#3f4947'
  inverse-surface: '#32302d'
  inverse-on-surface: '#f6f0ea'
  outline: '#6f7977'
  outline-variant: '#bec9c6'
  surface-tint: '#216962'
  primary: '#00453f'
  on-primary: '#ffffff'
  primary-container: '#115e57'
  on-primary-container: '#91d5cc'
  inverse-primary: '#8fd3ca'
  secondary: '#7c5802'
  on-secondary: '#ffffff'
  secondary-container: '#fecd73'
  on-secondary-container: '#785500'
  tertiary: '#00453e'
  on-tertiary: '#ffffff'
  tertiary-container: '#005f55'
  on-tertiary-container: '#86d7ca'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#abefe6'
  primary-fixed-dim: '#8fd3ca'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#ffdea7'
  secondary-fixed-dim: '#efbf67'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5e4200'
  tertiary-fixed: '#9ff2e3'
  tertiary-fixed-dim: '#84d5c7'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#fff8f3'
  on-background: '#1d1b18'
  surface-variant: '#e7e1dc'
typography:
  quran-display:
    fontFamily: Amiri Quran
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 72px
  quran-display-mobile:
    fontFamily: Amiri Quran
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 58px
  arabic-headline-lg:
    fontFamily: Noto Naskh Arabic
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 42px
  arabic-headline-md:
    fontFamily: Noto Naskh Arabic
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 34px
  arabic-body:
    fontFamily: Noto Sans Arabic
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 28px
  arabic-label:
    fontFamily: Noto Sans Arabic
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 20px
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an environment of meditative reverence, academic rigor, and adult dignity for mastering Tajweed according to the Hafs ‘an ‘Asim transmission. It deliberately avoids behavioral hooks, streak flames, fluorescent gamification badges, or high-pressure micro-copy. 

The aesthetic style is "Sand and Ink"—drawing heritage from classical manuscript traditions translated into an austere, highly functional modern interface. The emotional tone is contemplative, scholarly, and unhurried:
- **Atmosphere:** Clean, open, calm parchment-like surfaces meeting deep calligraphic inks.
- **Clarity & Respect:** Typography takes precedence above all decoration. Quranic script retains complete orthographic precision without optical distortion.
- **Subtlety:** Structure is defined through fine hairlines, generous breathing room, and soft tint fills rather than heavy drop shadows or saturated surfaces.

## Colors

The palette reproduces the chromatic balance of raw cotton paper, ground carbon ink, oxidized brass leaf, and verdigris wash.

### Light Mode (Default)
- **Canvas / Background:** `#F8F5EF` (Raw sand / unbleached parchment).
- **Surface (Elevated & Cards):** `#FFFFFF` (Pristine paper).
- **Subtle Fill / Secondary Surface:** `#F1EBDF` (Pressed sand for subtle inset panels and state rests).
- **Primary Ink (Text / Core Glyphs):** `#1C1A17` (Deep carbon ink).
- **Muted Ink (Subtitles / Rules / Metadata):** `#5F5850` (Tuscan earth).
- **Hairlines & Dividers:** `#E3DCCF` (1px structure line).
- **Primary Brand (Deep Teal):** `#115E57` (Verdigris teal) with strictly white `#FFFFFF` foreground text.
- **Secondary Accent (Dull Gold):** `#A9802E` (Illuminated manuscript gold) for step rings, chapter accents, and subtle micro-rules.
- **Phonetic & Tajweed Focus Highlight:** Foreground `#0B6E63` against background container `#E2EEEC`.

### Dark Mode (Night Recitation)
- **Canvas / Background:** `#121110` (Deep obsidian stone).
- **Surface:** `#1C1B19` (Charcoal slate).
- **Subtle Fill:** `#252320`.
- **Primary Ink:** `#EFE9DF` (Warm ivory).
- **Muted Ink:** `#9E978D` (Soft pebble).
- **Hairlines & Dividers:** `#2D2A26`.
- **Primary Brand:** `#23756A` (Luminous verdigris).
- **Secondary Accent:** `#D9B46A` (Pale metallic gold).
- **Phonetic Focus Highlight:** Foreground `#5FD3C2` against background container `#273834`.

## Typography

The type hierarchy resolves multi-script complexity across Arabic classical scripture, modern Arabic interface labels, and English pedagogical instructions:

- **Sacred Scripture (`Amiri Quran`):** Reserved exclusively for Quranic excerpts. Line heights are purposefully enlarged (minimum 1.8x to 2.0x font size) to provide ample room for complex harakat, shaddah, sukun, and madd signs without clipping. Verse numbers utilize classic end-of-ayah glyphs `﴿١﴾`.
- **Arabic Structural & Didactic Titles (`Noto Naskh Arabic`):** Provides formal, scholarly authority for lesson concepts, rules (e.g., الإدغام بغنة, أحكام النون الساكنة), and surah names.
- **Arabic UI & Controls (`Noto Sans Arabic`):** Optimized for high-legibility micro-copy, tabs, buttons, and system statuses.
- **Latin Typography (`Inter`):** Clean, structural, and neutral. Paired to support technical phonetics and explanations without competing visually with the Arabic glyphs.

## Layout & Spacing

Layouts conform to a responsive fluid grid that enforces high-density vertical margins to sustain an unhurried visual cadence.

- **Breakpoints:**
  - Compact (Mobile): `< 640px` | 4-column layout | `margin: 1rem` | `gutter: 1rem`
  - Medium (Tablet): `640px – 1024px` | 8-column layout | `margin: 2rem` | `gutter: 1.5rem`
  - Expanded (Desktop): `> 1024px` | 12-column layout (max content container `960px` centered) | `margin: 3.5rem` | `gutter: 2rem`
- **Touch Ergonomics:** All interactive targets (audio controls, step indicators, phonetic toggles) adhere to a strict minimum hit-box of `48px x 48px`.
- **RTL / LTR Symmetry:** The layout engine mirrors grid flow automatically based on language mode, maintaining identical gutter intervals and edge padding.

## Elevation & Depth

This design system avoids high-blur, saturated drop shadows. Depth is achieved via tonal surface layering and precise hairline boundaries:

- **Flat Spatial Planes:** Depth relies on the separation between the sand canvas (`#F8F5EF`) and white card tiles (`#FFFFFF`).
- **Hairline Framing:** Interfaces utilize `1px solid #E3DCCF` borders on all discrete cards, lesson modules, and segmented panels. In dark mode, borders turn to `1px solid #2D2A26`.
- **Ephemeral State Shadow:** Floating playheads or fixed bottom audio bars employ a single resting shadow tinted with carbon ink: `0 4px 20px -2px rgba(28, 26, 23, 0.05)`.
- **Active Focus Depth:** Focus states never use blur rings; they employ an offset outline of `1.5px solid #115E57` with a `2px` offset.

## Shapes

The geometry balances soft, humanistic curvature with architectural stability:
- **Interactive Controls:** Form inputs, action buttons, audio pills, and recitation tooltips use `14px` border radii.
- **Panels & Lesson Cards:** Content modules and scripture display containers use `18px` border radii.
- **Step Indicators & Badges:** Progress nodes along the learning path use circular geometry (`9999px`).
- **Icons:** Standardized at `24px` bounding boxes with a consistent `1.75px` stroke weight, rounded caps, and open joins.

## Components

### Buttons & Action Triggers
- **Primary Action:** Solid background `#115E57`, text `#FFFFFF`, border radius `14px`, height `48px`, padding `0 24px`. Hover: `#0D4D47`. Active: `#093B37`.
- **Secondary Action:** Transparent background, hairline border `1px solid #E3DCCF`, text `#1C1A17`. Hover: background `#F1EBDF`.
- **Tertiary Action:** Borderless, text `#115E57`, underline-offset `4px`.
- **Audio Control Floating Button:** Rounded circle (`56px x 56px`), background `#115E57`, icon white `24px` with `1.75px` stroke weight.

### Lesson Cards & Ayah Modules
- **Container:** Pure `#FFFFFF` background, `18px` corner radius, `1px solid #E3DCCF` border, inner padding `space-lg` (24px).
- **Tajweed Focus Highlight Area:** Inset within cards, words under recitation study receive a background tint of `#E2EEEC` with text colored `#0B6E63`, set in medium weight with a `6px` border radius padding.
- **Rule Annotation Callout:** Left border (or right border in RTL) accented with a `2px solid #A9802E` indicator, accompanied by a muted `#5F5850` instructional note.

### Tajweed Path Progress Tracker
- **Path Spine:** `1.5px` vertical or horizontal hairline in `#E3DCCF`.
- **Step Node (Unfinished):** `32px` diameter, `#F8F5EF` fill, `1px solid #E3DCCF` outline, muted index number.
- **Step Node (Current):** `32px` diameter, `#FFFFFF` fill, `1.5px solid #A9802E` outline, central `#A9802E` pip.
- **Step Node (Mastered):** `32px` diameter, `#115E57` fill, white checkmark (`1.75px` stroke). No confetti or pulsing animations.

### Audio Waveform & Playback Strip
- **Track Rail:** Height `4px`, background `#E3DCCF`, corner radius `2px`.
- **Progress Fill:** Background `#115E57`.
- **Ayah Scrubber:** Circular thumb `16px`, background `#FFFFFF`, border `2px solid #115E57`.

### Selection Controls (Radio & Checkbox)
- **Checkbox:** `20px x 20px`, `4px` radius, `1px solid #E3DCCF`. Checked: `#115E57` background with `#FFFFFF` check glyph.
- **Radio:** `20px x 20px`, circle, `1px solid #E3DCCF`. Selected: inner concentric ring of `#115E57` (`6px` fill) against `#FFFFFF` body.

### Chips & Metadata Badges
- **Makhraj & Sifah Badges:** Height `28px`, padding `0 12px`, radius `14px`, background `#F1EBDF`, text `#5F5850`, font size `12px`.
- **Rule Indicator (Active):** Height `28px`, background `#E2EEEC`, text `#0B6E63`, border `1px solid #A4D3CC`.