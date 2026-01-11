# CBSE Math Kids App Implementation Plan

## Goal Description
Expand the syllabus to include a comprehensive Grade 2 curriculum, covering Numbers (up to 999), Addition/Subtraction (with regrouping), Multiplication basics, Measurement, Time, Money, and Data Handling.

## User Review Required
> [!IMPORTANT]
> New topics will primarily use the **Quiz Engine** for now.
> A new **Visual Multiplication** module is proposed for a future update but not included in this immediate step.

## Proposed Changes

### Project Setup
#### [NEW] [package.json](file:///C:/Users/yshan/.gemini/antigravity/scratch/cbse-math-kids-app/package.json)
- React, Vite, Tailwind CSS, Lucide-React.
#### [NEW] [vite.config.js](file:///C:/Users/yshan/.gemini/antigravity/scratch/cbse-math-kids-app/vite.config.js)
- Add `vite-plugin-pwa` for offline support and installability.

### Assets
#### [NEW] [public/pwa-192x192.png](file:///C:/Users/yshan/.gemini/antigravity/scratch/cbse-math-kids-app/public/pwa-192x192.png)
#### [NEW] [public/pwa-512x512.png](file:///C:/Users/yshan/.gemini/antigravity/scratch/cbse-math-kids-app/public/pwa-512x512.png)
- App icons for PWA manifest.

### Core Architecture
#### [NEW] [App.jsx](file:///C:/Users/yshan/.gemini/antigravity/scratch/cbse-math-kids-app/src/App.jsx)
- Main entry point.
- Manages state for current view (Syllabus vs. Lesson vs. Quiz).

#### [NEW] [components/Layout.jsx](file:///C:/Users/yshan/.gemini/antigravity/scratch/cbse-math-kids-app/src/components/Layout.jsx)
- Implements the centered mobile phone frame.
- Applies the "Candy Land" color palette background.

### Data Layer
#### [NEW] [data/syllabus.js](file:///C:/Users/yshan/.gemini/antigravity/scratch/cbse-math-kids-app/src/data/syllabus.js)
- Hierarchical data: Grade -> Topic -> Subtopic.

### Features
#### [NEW] [components/Syllabus.jsx](file:///C:/Users/yshan/.gemini/antigravity/scratch/cbse-math-kids-app/src/components/Syllabus.jsx)
- Navigation component to browse grades and topics.

#### [NEW] [components/modules/VisualFractions.jsx](file:///C:/Users/yshan/.gemini/antigravity/scratch/cbse-math-kids-app/src/components/modules/VisualFractions.jsx)
- Interactive SVG pie chart.

#### [NEW] [components/modules/VisualAddition.jsx](file:///C:/Users/yshan/.gemini/antigravity/scratch/cbse-math-kids-app/src/components/modules/VisualAddition.jsx)
- Emoji-based counting interaction.

#### [NEW] [components/QuizEngine.jsx](file:///C:/Users/yshan/.gemini/antigravity/scratch/cbse-math-kids-app/src/components/QuizEngine.jsx)
- Handles questions, scoring, and visual feedback.

### Content Expansion
#### [MODIFY] [data/syllabus.js](file:///C:/Users/yshan/.gemini/antigravity/scratch/cbse-math-kids-app/src/data/syllabus.js)
- **Grade 2 Topics**:
    - **Numbers**: Counting to 999, Place Value (Hundreds, Tens, Ones), Expanding Numbers.
    - **Addition**: 2-digit and 3-digit addition (with/without carry).
    - **Subtraction**: 2-digit and 3-digit subtraction (with/without borrow).
    - **Multiplication**: Introduction (repeated addition), Tables of 2, 3, 4, 5, 10.
    - **Measurement**: Length (m, cm), Weight (kg, g), Capacity (l, ml).
    - **Time**: Reading the clock (quarter past/to), Calendar.
    - **Money**: Indian Currency (Notes & Coins), Simple calculations.
    - **Shapes**: 2D & 3D Shapes properties (sides, corners).
    - **Patterns**: Growing and Reducing patterns.

#### [MODIFY] [data/questions.js](file:///C:/Users/yshan/.gemini/antigravity/scratch/cbse-math-kids-app/src/data/questions.js)
- **Add Grade 2 Questions**:
    - Map all new IDs from `syllabus.js` (e.g., `g2-t1-s1`, `g2-t4-s2`) to specific question sets.
    - Create 3-5 questions per subtopic to ensure variety.
    - Cover: Place Value, Addition/Subtraction (regrouping), Multiplication Tables (2-5, 10), Measurement, Time, Money.

- **Populate Grade 1 Questions**:
    - Fill in missing topics: Take Away, Shapes (3D), Patterns, Measurement, Time, Money.
    - Ensure "Take Away" specifically has subtraction questions (e.g., "5 - 2 = ?").

## Verification Plan

### Automated Tests
- `npm run dev` to verify the build and runtime.
- Browser testing to ensure responsiveness and interactivity.

### Manual Verification
- Verify "Mobile-First" layout on desktop (centered frame).
- Test navigation through the syllabus.
- Interact with Visual Fractions (sliders/clicks).
- Interact with Visual Addition (tapping).
- Complete a quiz and check score tracking.
