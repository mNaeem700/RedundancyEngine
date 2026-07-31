# RedundancyEngine (DedupliShield AI) 🛡️

> **Real-Time Pre-Ingestion Data Redundancy Removal & AI False-Positive Detection Gateway**

RedundancyEngine is an enterprise-grade pre-ingestion gatekeeper that validates incoming data records in real time before they reach cloud databases. It prevents duplicate record pollution, catches subtle fuzzy text variations and typos, and leverages **Google Gemini 3.6 Flash** to intelligent verify false positives.

---

## 🌟 Key Features

1. **Multi-Stage Algorithmic Gatekeeper**:
   - **SHA-256 Content Hashing**: Instant O(1) detection and rejection of exact duplicate record payloads.
   - **Soundex Phonetic Matching**: Catches phonetic misspellings in titles and names (e.g., "John Smith" vs. "Jon Smyth").
   - **Weighted Field Jaro-Winkler & Levenshtein Similarity**: Computes field-level similarity across Primary Keys, Titles, Contact Data, and Payload Content text.

2. **Gemini 3.6 Flash AI Contextual False-Positive Resolver**:
   - Leverages `gemini-3.6-flash` via the `@google/genai` SDK to evaluate semantic context when algorithmic similarity is high.
   - Differentiates between actual duplicate records and distinct entities sharing common fields (e.g., two patients sharing the same attending physician or two orders from the same company).

3. **Human-in-the-Loop Quarantine Queue**:
   - Isolates borderline matches (e.g., 70%–95% similarity) into a review queue.
   - Allows reviewers to inspect matched fields side-by-side, read AI rationale, and execute **Approve False Positive**, **Confirm Duplicate**, or **Smart Merge**.

4. **Batch Ingestion & Stress Lab**:
   - Process bulk JSON arrays in a single batch request.
   - Built-in simulation lab for workload stress testing with synthetic datasets across Customers, Medical, Billing, and Inventory domains.

5. **Analytics & Immutable Audit Trail**:
   - Real-time performance metrics tracking duplicates prevented, storage saved (KB), accuracy rates, and execution time.
   - Immutable audit logging for compliance and data quality tracking.

---

## ⚙️ How It Works (Pipeline Architecture)

```
[ Incoming Payload ]
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 1: Exact Hash Check (SHA-256)                     │
│ ➔ 100% Match? ──[ YES ]──► [ Auto-Reject Duplicate ]    │
└───────────────────┬─────────────────────────────────────┘
                    │ [ NO ]
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 2: Soundex & Multi-Field Fuzzy Comparison        │
│ ➔ Calculates Jaro-Winkler scores per field              │
│ ➔ Overall Similarity < Threshold (75%)? ──► [ Append ]  │
└───────────────────┬─────────────────────────────────────┘
                    │ [ Similarity >= 75% ]
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 3: Gemini AI False-Positive Analysis              │
│ ➔ Analyzes semantic context & domain differences         │
│ ➔ Distinct Entity Confirmed? ────[ YES ]──► [ Append ]   │
└───────────────────┬─────────────────────────────────────┘
                    │ [ Borderline / High Risk ]
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 4: Human-in-the-Loop Quarantine Queue             │
│ ➔ Reviewer resolves: Approve, Block, or Smart Merge     │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Project Structure

```
├── server.ts                    # Full-stack Express server with API routes & Vite middleware
├── src/
│   ├── App.tsx                  # Main application dashboard & layout
│   ├── components/              # Modular UI components (Neo-Brutalist theme)
│   │   ├── IngestionPipeline.tsx # Single & Batch entry validation gateway
│   │   ├── DatabaseExplorer.tsx  # Searchable view of verified appended records
│   │   ├── QuarantineQueue.tsx   # Human-in-the-Loop review workspace
│   │   ├── AnalyticsDashboard.tsx# Metrics, storage savings, & audit logs
│   │   ├── SimulationLab.tsx    # Stress-testing & synthetic dataset generator
│   │   └── SettingsModal.tsx    # Gatekeeper configuration modal
│   ├── lib/
│   │   └── geminiClassifier.ts  # Gemini 3.6 Flash AI false-positive analysis client
│   ├── types.ts                 # TypeScript types, interfaces & enums
│   └── index.css                # Global Tailwind CSS styling
├── package.json                 # Dependencies & scripts
├── metadata.json                # Applet configuration
└── .env.example                 # Environment variable declarations
```

---

## 🚀 Environment & Setup

### Environment Variables

Create a `.env` file (or configure environment variables in your deployment platform):

```env
# Gemini API Key for server-side AI contextual evaluation
GEMINI_API_KEY=your_gemini_api_key_here

# Dev server port (Default: 3000)
PORT=3000
```

---

## 🏃 Running the Application

### Development Mode

To start the full-stack Express + Vite development server:

```bash
npm run dev
```

The server binds to `0.0.0.0:3000` with active Vite middleware for instant hot-reloading.

### Production Build & Execution

To compile both client static assets and the server bundle:

```bash
# 1. Build client static assets and bundle server into dist/server.cjs
npm run build

# 2. Start the production Node server
npm run start
```

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/records` | Fetch verified appended records with optional `q` search and `domain` filter |
| `POST` | `/api/validate` | Execute pre-ingestion validation for a single record payload |
| `POST` | `/api/batch-validate` | Validate and ingest a batch JSON array of records |
| `GET` | `/api/quarantine` | Retrieve flagged records pending human review |
| `POST` | `/api/quarantine/:id/resolve` | Execute reviewer decision (`APPROVE_FALSE_POSITIVE`, `CONFIRM_DUPLICATE`, `SMART_MERGE`) |
| `GET` | `/api/analytics` | Retrieve metrics, storage saved, and accuracy stats |
| `GET` | `/api/audit-logs` | Stream immutable pre-ingestion gatekeeper logs |
| `GET` | `/api/config` | Retrieve current deduplication engine settings |
| `POST` | `/api/config` | Update similarity thresholds, AI checks, and Soundex toggles |

---

## 🧪 Quick Test Scenarios

Inside the **Ingestion Gateway** tab, use the 1-Click Instant Test Scenario buttons:
- **Exact Hash Match**: Attempts to insert a 100% identical payload to demonstrate instant O(1) hash rejection.
- **Subtle Typo Duplicate**: Tests fuzzy matching on names like `"Alex Morgen"` vs. `"Alex Morgan"`.
- **AI False Positive**: Ingests two medical records sharing identical doctor names and clinics, triggering Gemini AI to identify distinct patient IDs and blood types to prevent improper rejection.
- **Unique Record**: Validates a unique record payload that passes all checks smoothly.

---

## 📄 License

MIT License - feel free to adapt for production pre-ingestion pipelines.
