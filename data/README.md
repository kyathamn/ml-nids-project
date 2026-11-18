# Benchmark Datasets for Network Intrusion Detection (NIDS)

This project models and benchmarks against the three primary standard academic NIDS benchmark datasets:

## 1. Dataset Files & Locations in This Project

| Component | File Path | Purpose |
| :--- | :--- | :--- |
| **Dataset Registry & Taxonomy** | `server/datasets.ts` | Benchmark class distributions, 16 ranked features, attack taxonomy (DoS, Probe, R2L, U2R, Normal). |
| **Sample NSL-KDD CSV** | `data/nsl_kdd_sample.csv` | Sample flow records in official 41-feature NSL-KDD format across all 5 classes. |
| **Data Inclusion Analyzer** | `scripts/inclusion.ts` | CLI tool to inspect dataset samples, class distributions, and feature Information Gain (IG) scores. |
| **Model Preprocessing Engine** | `server/ml-engine.ts` | Normalization (MinMax/Standard/Robust), train/test splitting (60/40, 75/25, 80/20), and feature extraction. |

---

## 2. Supported Benchmark Datasets

### A. NSL-KDD (Default Benchmark)
- **Total Instances**: 125,973 training records / 22,544 test records
- **Feature Dimensions**: 41 network flow attributes + 1 class label
- **Distribution**:
  - `Normal`: 67,343 (53.46%)
  - `DoS`: 45,927 (36.46%)
  - `Probe`: 11,656 (9.25%)
  - `R2L`: 995 (0.79%)
  - `U2R`: 52 (0.04%)
- **Source**: University of New Brunswick (UNB) - [Download NSL-KDD](https://www.unb.ca/cic/datasets/nsl.html)

### B. KDD Cup 1999
- **Total Instances**: 494,021 (10% subset) / 4,898,431 (full set)
- **Feature Dimensions**: 41 network connection attributes
- **Source**: UCI Machine Learning Repository - [Download KDD Cup 99](https://archive.ics.uci.edu/dataset/130/kdd+cup+1999+data)

### C. CIC-IDS2017
- **Total Instances**: 2,830,743 network flows
- **Feature Dimensions**: 78 bidirectional flow metrics (duration, packet size, inter-arrival time, flag counts)
- **Source**: Canadian Institute for Cybersecurity - [Download CIC-IDS2017](https://www.unb.ca/cic/datasets/ids-2017.html)

---

## 3. How to Inspect & Switch Datasets

- **From the Command Line**:
  ```bash
  # Inspect NSL-KDD inclusion:
  npm run inclusion -- --dataset=nsl-kdd

  # Inspect KDD Cup 99 inclusion:
  npm run inclusion -- --dataset=kdd-cup-99

  # Inspect CIC-IDS2017 inclusion:
  npm run inclusion -- --dataset=cic-ids2017
  ```

- **From the Web Interface**:
  - Open `http://localhost:3000`
  - Navigate to **"Preprocessing & Features"**
  - Use the **"Active Benchmark Dataset"** dropdown in the top right to switch between datasets.
