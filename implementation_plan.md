# Production-Grade ATS Resume Builder System Plan

## Vision
A "Zero-Fluff" ATS-Optimized Resume Builder that enforces strict parsing rules to guarantee 70-95+ ATS scores. This is not a design tool; it is a compliance tool.

## Key Architecture Changes

### 1. Robust Data Model (`types/resume.ts`)
We will replace the simple interface with a strictly typed `ResumeRoot` aggregate.

- **`ResumeRoot`**: Top-level entity with `id`, `atsProfile`, `metadata`.
- **`ATSMetadata`**: Tracks `parsingScore`, `keywordScore`, `formattingSafe` (boolean).
- **`BulletPoint`**: Rich object ` { id, text, actionVerb, hasMetric: boolean, score }`.
- **`TemplateConfig`**: New type defining strict constraints (e.g., `allowColumns: false`).

### 2. State Management (Zustand)
We will implement `store/useResumeStore.ts` using `zustand` for high-performance state updates.
- **`actions`**: `updateSection`, `reorderSafe`, `setTemplate`.
- **`selectors`**: `selectATSScore`, `selectWarnings`.
- **`persistence`**: Middleware to sync with `localStorage` (key: `pro_ats_resume_v2`).

### 3. Dual-Engine Rendering
To ensure "What You See Is What Parsers See":
- **`VisualPreview`**: React components rendering the resumption.
- **`ATSParserSimulator`**: Invisible text-extraction layer that runs alongside to validate parsing integrity.

### 4. Template Governance Engine
Directory: `components/resume/templates/`
- **`BaseTemplate`**: A rigid, table-free, single-column layout structure.
- **`StrictGovernance`**: Utility that strips icons, tables, and non-standard fonts before render.
- **`TemplateRegistry`**: Map of allowed, pre-validated templates (Modern, Classic, Technical, etc.).

### 5. Intelligent Features
- **`BulletAssistant`**: Real-time regex analysis for action verbs and metrics (numbers, %, $).
- **`JDMatcher`**: Input field for Job Description → extracts keywords → updates `ResumeRoot.keywords`.
- **`ATSScorer`**:
  - `Parsing Accuracy` (25%)
  - `Keyword Match` (35%)
  - `Section Structure` (15%)
  - `Formatting Safety` (15%)
  - `Role Alignment` (10%)

## Detailed Component Plan

### `d:/New Downloads Folder/NewUnitoolbox/pages/ResumeBuilder.tsx`
- **State Logic**: Initialize `useResumeStore`.
- **Layout**:
  - **Left**: `EditorPanel` (Strict forms).
  - **Center**: `LivePreview` (with Zoom & ATS Text overlay toggle).
  - **Top Bar**: `GlobalStats` (Score, Warnings).
  - **Right**: `ATSPanel` (Score breakdown, "Use This Keyword" actions).

### `components/resume/editor/`
- `HeaderForm`: Enforces LinkedIn/Github inputs.
- `ExperienceForm`: Bullets are individual inputs with real-time "Weak/Strong" tags.
- `JobDescriptionInput`: Text area that drives the "Keyword Match" score.

### `components/resume/ats/`
- `ScoreRing`: Visual score indicator.
- `SuggestionList`: Actionable fixes (e.g., "Add 2 more numbers to Experience").

## Verification & Safety
- **Export Guard**: "Export" button is disabled if `formattingSafe` is false.
- **Honesty Banner**: Persistent banner stating "Optimized for Parsing, Not Design".
- **Version History**: Basic Undo/Redo support via `zundo` (if compatible) or manual history stack.

## Implementation Steps
1.  **Dependencies**: Install `zustand`, `clsx`, `lucide-react`.
2.  **Types**: Create strict definitions in `types.ts`.
3.  **Store**: Build `useResumeStore` with validation logic.
4.  **UI Shell**: Build the 3-pane layout scaffold.
5.  **Editor**: Implement strict inputs for Header & Experience.
6.  **ATS Engine**: Implement specific regex rules for scoring.
7.  **Preview**: Port the existing "Modern" layout to the new rigid system.
8.  **Templates**: Add 2 more variations (Classic, Technical).
9.  **Verification**: Manual test against "ATS Rules".
