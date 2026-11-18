# Network Intrusion Detection System Using Machine Learning (ML-NIDS)

A production-grade, supervised machine learning platform for network anomaly detection, feature selection, and intrusion classification. Built with **Decision Trees (CART)**, **Random Forest Ensembles**, **Support Vector Machines (SVM)**, and **Artificial Neural Networks (MLP)**.

---

## 🚀 How to Run in VS Code Terminal

### Prerequisites
- **Node.js** (v18.0.0 or higher). Check with:
  ```bash
  node -v
  ```

---

### Step 1: Open Terminal in VS Code
Press <kbd>Ctrl</kbd> + <kbd>`</kbd> (Windows/Linux) or <kbd>Cmd</kbd> + <kbd>`</kbd> (Mac) to open the VS Code integrated terminal.

---

### Step 2: Install Dependencies
Run the install command to download all required packages:
```bash
npm install
```

---

### Step 3: Start the Development Server
Run the full-stack development server:
```bash
npm run dev
```

You should see:
```text
  ➜  ML-NIDS Server running:
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://127.0.0.1:3000/
```

Click or open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Alternative Quick Run (Pure Vite)
If you prefer running the front-end directly via Vite:
```bash
npm run dev:vite
```
or
```bash
npx vite
```

---

## 🛠️ Troubleshooting Common VS Code Terminal Issues

### Issue 1: `'tsx' is not recognized as an internal or external command` (Windows)
**Cause:** Dependencies were not installed before running the script.  
**Fix:** Run `npm install` first. If it persists, run via Vite:
```bash
npm install
npm run dev:vite
```

### Issue 2: `Port 3000 is already in use`
**Fix:** Run on a custom port by passing the `PORT` environment variable:
- **Mac/Linux:**
  ```bash
  PORT=3001 npm run dev
  ```
- **Windows (PowerShell):**
  ```powershell
  $env:PORT=3001; npm run dev
  ```
- **Or use Vite:**
  ```bash
  npx vite --port 3001
  ```

### Issue 3: PowerShell Script Execution Policy Error
**Cause:** Windows PowerShell prevents script execution by default.  
**Fix:** Run in Command Prompt (`cmd`) inside VS Code, or run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run dev
```

---

## 📊 Features & Navigation
- **Live Monitor**: Live simulated packet stream with real-time intrusion classification, attack scenario injector (SYN Flood, Smurf, PortSweep), and deep packet inspector.
- **Model Benchmark**: Side-by-side comparative evaluation of Decision Tree, Random Forest, SVM, and Neural Network across Accuracy, Precision, Recall, F1, FAR, ROC AUC, and Confusion Matrices.
- **Feature Studio**: Information Gain feature importance ranking and interactive dimensionality reduction (All 15, Top 10, Top 5).
- **Packet Tester**: Manual flow attribute builder and simultaneous 4-model classification.
- **Study Paper**: Structured research paper summarizing problem formulation, mathematical framework, and experimental findings.
