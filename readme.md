# 🧠 Data Retrieval (Solana Governance Program)

This project retrieves and analyzes **Solana on-chain governance data**, including:
- Governance program deployments
- Realm-level proposals
- Voting data and DAO participation

The data is fetched via **Node.js scripts** and later analyzed in a **Python Jupyter notebook** (`RealmsData.ipynb`).

---

## 🚀 Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/Rufidatul726/data-retrival.git
cd data-retrival
````

---

### 2. Install Node.js dependencies

Make sure you have **Node.js v18+**.

```bash
npm install
```

If you see module errors later, install missing dependencies manually:

```bash
npm install @solana/web3.js @solana/spl-governance fs path
```

---

### 3. Create the `program_ids.txt` file

The Node.js scripts require a list of Solana Governance Program IDs.

Create a file in the **project root** called `program_ids.txt`:

```
GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw
gUAedF544JeE6NYbQakQvribHykUNgaPJqcgf3UQVnY
GqTPL6qRf5aUuqscLh8Rg2HTxPUXfhhAXDptTLhp1t2J
```

> ⚠️ If this file is missing, you’ll get:
>
> ```
> Error: ENOENT: no such file or directory, open '.../program_ids.txt'
> ```

---

### 4. Run the Node.js scripts

#### a) Fetch all governance program deployments

```bash
node ./node/getDeployment.mjs
```

This script:

* Reads all program IDs from `program_ids.txt`
* Fetches deployment info from Solana RPC
* Saves output under the `datasets/` folder

#### b) Fetch all proposals for active realms

```bash
node ./node/getProposals.mjs
```

This script:

* Loads realms that have >0 active or completed votes
* Retrieves proposals from the governance program
* Stores data for further analysis

---

### 5. (Optional) Change RPC Endpoint

You can modify the RPC endpoint in either script:

```js
const RPC_URL = 'https://api.mainnet-beta.solana.com';
```

or use a custom one (for better rate limits):

```js
const RPC_URL = 'https://lb.drpc.live/solana/AnB81nqFRk-OvTFykc2CC9gEj9iXiPoR8IlRqhnKxixj';
```

---

## 📊 6. Data Analysis (Python Notebook)

Once data is collected by the Node.js scripts, analyze it with **`RealmsData.ipynb`**.

You can run it either in **Google Colab** or **Jupyter Notebook**.

### 🧩 Steps (Google Colab)

1. Upload the `data-retrival` folder to your Google Drive.
2. Open **Google Colab** → click **File → Open Notebook → Google Drive**.
3. Open `RealmsData.ipynb`.
4. Mount your Drive:

   ```python
   from google.colab import drive
   drive.mount('/content/drive')
   ```
5. Update the dataset directory if needed:

   ```python
   REALMS_NODE_DIR = '/content/drive/MyDrive/Egalitarian DAOs/datasets/raw data/realm/'
   ```
6. Run all cells (`Runtime → Run all`).

The notebook:

* Loads realm & proposal data
* Cleans and merges datasets
* Computes statistics (e.g., number of voters, proposals, deployments)
* Exports processed CSVs for visualization

---

## 🧩 Folder Structure

```
data-retrival/
│
├── node/
│   ├── getDeployment.mjs      # Fetch governance program deployments
│   ├── getProposals.mjs       # Fetch governance proposals
│
├── datasets/
│   ├── raw/                   # Raw on-chain data
│   └── processed/             # Cleaned data for analysis
│
├── notebooks/
│   └── RealmsData.ipynb       # Python/Colab analysis notebook
│
├── program_ids.txt            # Governance program ID list
│
├── package.json
└── README.md
```

---

## 🧰 Troubleshooting

### ❌ `ENOENT: no such file or directory`

You forgot to create `program_ids.txt`. Place it in:

```
data-retrival/program_ids.txt
```

### ⚙️ `Cannot find module '@solana/web3.js'`

Run:

```bash
npm install @solana/web3.js @solana/spl-governance
```

### 📉 Slow or failed RPC responses

Try switching RPC endpoints to a faster provider (e.g. `https://api.devnet.solana.com` or `https://lb.drpc.live`).

---

## 🧠 Notes

* Node scripts use **ECMAScript Modules (ESM)** (`import`, not `require`).
* Use **Node.js v18+** for top-level `await` support.
* Data from Solana RPC may take time due to rate limits — be patient!

---

## 🧑‍💻 Author

**Rufidatul Islam**
🔗 [GitHub: Rufidatul726](https://github.com/Rufidatul726)

---

## 📜 License

MIT License — free to use, modify, and distribute.