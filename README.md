# BrandPilot Intelligence 🛡️
> **Evidence-Driven Brand Governance Before Publication**  
> *Developed for Veriqo / Inkloom AI Hackathon (Team WECODERS-48)*

BrandPilot Intelligence is an enterprise brand safety and governance platform that audits marketing creatives (social posts, pamphlets, and web banners) against a single source of brand truth before publication.

---

## 🌟 Core Modules

### 1. Brand Memory (Source of Truth)
- Centralized registry for brand facts, active vs legacy product prices, approved and banned claims, and statutory disclaimers.
- Versioned guidelines (v3.2 / v3.3) tracking validity periods and expiration dates.
- Visual token inspection: primary brand emerald (`#00473E`), refined gold (`#C89B3C`), and pearl cream surfaces.
- Logo assets management (Active Logo v3.0 Botanical Emblem vs deprecated Vintage Crest v2.1).

### 2. Content Auditor (Evidence-Backed Creative Verification)
- **Interactive Multi-Format Preview**: Inspects live marketing assets (Instagram posts, clinical pamphlets, web banners, and custom uploads).
- **Exact Coordinate Pinning**: Interactive circular pins (❶, ❷, ❸, ❹, ❺, etc.) anchored directly over violations on ad images and draft copy.
- **In-Place Fix Application**: Click *"Accept & Apply Fix"* to instantly update findings and turn visual pins green (`✓ Fixed`).
- **One-Click Creative Regeneration**: Toggle *"Fixed (Approved)"* to preview the fully compliant, on-brand regenerated creative.
- **Brand Tone & Palette Theme Auditing**: Automatically identifies off-brand sensationalist hype, banned miracle claims, and unauthorized colors against Brand Memory.
- **Groq AI Copilot**: Real-time LLM inference for tone analysis, copy reconstruction, and compliance reporting.
- **OCR Engine**: Tesseract.js image preprocessing for reading copy directly from uploaded creative files.

### 3. Campaign Consistency Engine
- Multi-asset batch comparison across channels (Instagram, Doctor Handouts, Retargeting Banners).
- Cross-channel conflict detection: spots price divergence (₹1,099 vs ₹1,299), expired promotional dates, and outdated taglines.
- Auto-align recommendations to maintain uniform brand integrity across all consumer touchpoints.

### 4. Governance Ledger & Audit Trail
- Immutable log of all review decisions (`ACCEPTED`, `DISPUTED`, `ESCALATED`).
- Audit trail tracking timestamp, reviewer signature, flagged text, and referenced Brand Memory policy version.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Modern Vanilla CSS Design System (Glassmorphic cards, curved sections, high-contrast badges)
- **Icons**: Lucide React
- **AI Inference**: Groq Cloud SDK (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`)
- **OCR**: Tesseract.js with canvas luminance normalization

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/tejask011/BrandPilot.git
cd BrandPilot
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and insert your Groq API key:
```bash
cp .env.example .env
```
Inside `.env`:
```env
# Server-side API key for Groq AI inference proxy
GROQ_API_KEY=gsk_your_groq_api_key_here
PORT=3001
```

### 3. Run Development Servers
To start both the Backend Proxy Server (Port 3001) and Vite Frontend (Port 5173) together:
```bash
npm run dev:all
```

Alternatively, you can run them in separate terminal tabs:
```bash
# Terminal 1: Backend Express AI Proxy
npm run server

# Terminal 2: Vite Client
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 📄 License
MIT License. Built for Team WECODERS-48.
