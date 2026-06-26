# AI Verify Testing Framework - Process Checks Web App

A high-fidelity, client-side web application built with **React**, **TypeScript**, and **Vite** that implements the official **AI Verify Testing Framework (Process Checks for Generative AI)**. 

This application runs entirely in the browser, storing all user assessment workspaces locally via `localStorage` for absolute data privacy. It allows users to complete compliance checklists, import/export progress via Excel spreadsheets, upload technical test results from **Project Moonshot**, and generate professional PDF reports.

## 🚀 Key Features

- **11 Responsible AI Principles Checklist:** Interactive assessment including Transparency, Explainability, Safety, Security, Robustness, Fairness, Data Governance, Accountability, Human Agency, and Societal/Environmental Well-being.
- **Framework Crosswalk Mapping Badges:** Visual indicators showing mapping to international frameworks:
  - **US NIST AI RMF**
  - **ISO/IEC 42001**
  - **G7 Hiroshima Process Code of Conduct**
- **Offline Excel Sync:** Export progress to the official AI Verify Excel template or import completed Excel spreadsheets to resume evaluations seamlessly.
- **Technical Test Integration:** Upload automated benchmark reports (`.json`) from Project Moonshot to bundle technical findings with process checks.
- **Client-Side PDF Generation:** Download a professional summary report cover page, assessment metadata, progress metrics, and complete process audits.
- **Privacy First:** 100% client-side execution. No compliance data or corporate secrets are sent to external servers or databases.

---

## 🛠️ Folder Structure

```
├── public/                 # Static assets
│   └── assets/
│       ├── references/     # Excel templates & mapping JSONs
│       └── images/         # Logo & diagrams
├── src/
│   ├── components/         # React Views (Welcome, Setup, Checklist, etc.)
│   ├── utils/              # PDF and Excel engines (jsPDF, SheetJS)
│   ├── App.tsx             # State machine & localStorage controller
│   └── index.css           # Custom purple-branded CSS stylesheet
├── streamlit-app/          # Preserved copy of the original Python/Streamlit app
└── package.json            # React project dependencies & build configurations
```

---

## 💻 Local Development

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
Run the following commands in the project root:
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

### Production Build
Verify the build compiles successfully:
```bash
npm run build
```
The compiled static assets will be output to the `dist/` directory.

---

## ☁️ Deployment to Cloudflare Pages

This application is fully optimized for serverless edge deployment on **Cloudflare Pages**.

### Option 1: Automatic Deployment via Git Integration (Recommended)
1. Commit and push the codebase to your GitHub repository (`https://github.com/angseesiang/docker`).
2. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository (`angseesiang/docker`).
4. In the **Build settings** section, configure the following:
   - **Framework preset:** `Vite` (or `None`)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Save and Deploy**. Cloudflare will automatically build and deploy your app on every git commit.

### Option 2: Manual Deployment via Wrangler CLI
If you want to deploy directly from your local terminal:
```bash
# Install wrangler globally if not already installed
npm install -g wrangler

# Login to your Cloudflare account
wrangler login

# Deploy the build directory
wrangler pages deploy dist --project-name=ai-verify-process-checks
```
Follow the CLI prompts to select your deployment workspace.
