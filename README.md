# Project Eldritch Character Tracker

This version uses pixel-positioned controls matched to the supplied 1536 × 1024 character-sheet artwork.

## Features
- Pixel-aligned identity, attribute, combat, resistance, journal, equipment, notes, and condition controls
- Draggable Notebook and Backpack tools with searchable tabbed entries
- Clickable condition boxes
- Current/max HP tracker and quick HP controls
- Attribute d20 roller
- Automatic local browser save
- JSON export/import

Open `index.html` in a modern browser. Keep `index.html`, `styles.css`, `app.js`, and `eldritch-sheet.png` together in the same folder.


## Latest alignment update
- Added an editable field for the blank **Other** resistance label.
- Shifted and resized the Journal Notes writing area to begin on the printed ruled lines.


## Temporary health

The combat overview now includes a dedicated Temporary Health field.

The Quick Controls health bar displays:
- normal health with a red-to-yellow-to-green gradient;
- temporary health as a blue segment.

Damage applied with the negative Quick Control buttons is deducted from temporary health before current health.


## Artwork cleanup
Removed the blurred underlying “Saves / Resistances” lettering from the health boxes.

## Custom tabs
Notebook and Backpack tabs can be added with the + button, renamed with the pencil button, and deleted with the × button. At least one tab is always retained. Tab names and contents are included in local saves and exported character files.

## Moving tools
Drag either expanded window by its header. The large notebook and backpack icons can also be dragged directly; click an icon without dragging to open or collapse it.

## Coin purse
The character sheet includes a draggable, resizable coin purse. It tracks gold, silver, and copper balances, supports quick and custom additions/removals, and saves a timestamped transaction history with optional notes. Coin data is included in character saves, exports, imports, and resets.


## Character Tome update
- Adds a draggable, resizable Character Tome that mirrors and edits the original sheet data.
- Includes Overview, Attributes, Combat, Resistances, Conditions, and Biography sections.
- Moves quick health controls into the tome, including temporary HP absorption.
- Links directly to the Journal, Backpack, and Coin Purse.
- The previous fixed Quick Controls dock is hidden; d20 rolling is available on the Combat page.


## Polished Character Tome health/status redesign
- Circular animated HP ring with separate temporary-HP arc
- Stable, wounded, critical, and unconscious visual states
- Damage, healing, and temporary-HP feedback animations
- Animated condition states for bleeding, infected, broken, insane, exhausted, restrained, frightened, silenced, hallucinating, and unconscious
- Active-condition chips and condition symbols
- Refined Character Tome hierarchy, spacing, focus states, inputs, tabs, and responsive layout
- Reduced-motion support

Latest update:
- Restored the pre-noir parchment/tabletop theme.
- Replaced mechanical infection sweeps and shakes with biological tissue growth, branching vessels, translucent lesions, and slow organic pulsation.
- Infection intensity still scales from level 1 through 10, but remains readable and contained in the health display.
