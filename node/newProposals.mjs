// fetch_proposals_from_realms.js
import fs from 'fs';
import path from 'path';

const splGovernanceModule = await import('@solana/spl-governance');
const solanaWeb3 = await import('@solana/web3.js');
const { getAllProposals } = splGovernanceModule;
const { Connection, PublicKey } = solanaWeb3;

// === Config ===
const RPC_URL = 'https://devnet.helius-rpc.com/';
const COMMITMENT = 'confirmed';
const DEPLOYMENTS_DIR = 'output_deployments_2025_10_4'; // input realms
const BASE_DATE = new Date(2025, 9, 3);
const OUTPUT_DIR = `output_proposals_${BASE_DATE.getFullYear()}_${BASE_DATE.getMonth() + 1}_${BASE_DATE.getDate()}`;

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('RPC:', RPC_URL);
console.log('Using commitment:', COMMITMENT);

// === Helpers ===
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper with exponential backoff
async function withRetry(fn, retries = 5, delay = 60000) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${attempt} failed: ${err.message}`);
      if (attempt < retries) {
        const wait = delay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${wait / 1000}s...`);
        await sleep(wait);
      }
    }
  }
  throw lastError;
}

// === Proposal fetch ===
async function getProposalsForRealm(connection, programIdStr, realmPubkeyStr) {
  const programId = new PublicKey(programIdStr);
  const realmPubkey = new PublicKey(realmPubkeyStr);

  const outputFile = path.join(OUTPUT_DIR, `${programId}_${realmPubkey}_proposals.json`);
  if (fs.existsSync(outputFile)) {
    console.log('  skipping (exists)', programIdStr, realmPubkeyStr);
    return;
  }

  try {
    const realmProposals = await withRetry(
      () => getAllProposals(connection, programId, realmPubkey),
      10, // retries
      60000 // start delay
    );

    // Normalize numeric fields
    realmProposals.forEach(group =>
      group.forEach(proposal => {
        if (proposal.account?.votingCompletedAt) {
          proposal.account.votingCompletedAt = proposal.account.votingCompletedAt.toNumber();
        }
      })
    );

    fs.writeFileSync(outputFile, JSON.stringify(realmProposals, null, 2));
    console.log('  ✅ finished', programIdStr, realmPubkeyStr);
  } catch (err) {
    console.error('  ❌ failed', programIdStr, realmPubkeyStr, '-', err.message);
    const failedFile = path.join(OUTPUT_DIR, 'failed_proposals.json');
    let failedList = [];
    if (fs.existsSync(failedFile)) {
      try {
        failedList = JSON.parse(fs.readFileSync(failedFile, 'utf-8'));
      } catch {}
    }
    failedList.push({ programId: programIdStr, realmPubkey: realmPubkeyStr, error: err.message });
    fs.writeFileSync(failedFile, JSON.stringify(failedList, null, 2));
  }
}

// === Main logic ===
const connection = new Connection(RPC_URL, COMMITMENT);

// Load program IDs
const programIds = fs.readFileSync('program_ids.txt', 'utf-8')
  .split('\n')
  .map(id => id.trim())
  .filter(id => id.length > 0);

console.log('Loaded', programIds.length, 'program IDs');

// Load realms from deployment outputs
let allRealms = [];
for (const programId of programIds) {
  const file = path.join(DEPLOYMENTS_DIR, `${programId}_realms.json`);
  if (!fs.existsSync(file)) {
    console.warn('Warning: file not found', file);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  if (Array.isArray(data)) {
    allRealms.push(...data.map(r => ({ ...r, owner: programId })));
  }
}

console.log('Total realms loaded:', allRealms.length);

// === Fetch proposals ===
let processed = 0;
for (const realm of allRealms) {
  const programId = realm.owner;
  const realmPubkey = realm.pubkey;

  if (!realm.account) {
    console.log('Skipping (no account):', programId, realmPubkey);
    continue;
  }

  // Skip if no proposals
  const proposalCount = realm.account.votingProposalCount ?? 0;
  if (proposalCount === 0) {
    console.log('Skipping (no proposals):', programId, realmPubkey);
    continue;
  }

  const outputFile = path.join(OUTPUT_DIR, `${programId}_${realmPubkey}_proposals.json`);
  if (fs.existsSync(outputFile)) {
    console.log('Skipping (already saved):', programId, realmPubkey);
    continue;
  }

  console.log(`Fetching proposals for realm ${realmPubkey} [${processed + 1}/${allRealms.length}]`);
  await getProposalsForRealm(connection, programId, realmPubkey);

  processed++;
  console.log(`⏳ Waiting 60s before next...`);
  await sleep(60000);
}

console.log('\n=== DONE ===');
console.log(`Processed ${processed} realms with proposals`);
