'use strict';

/**
 * AceMedia — Daily GHL Lead Scraper
 *
 * Rotates through all 50 US states (one per day), runs each search term
 * against the Apify Google Maps Scraper, collects 325 results per term,
 * exports a combined CSV, and drops it in the watched/ folder for GHL import.
 *
 * Usage:
 *   APIFY_TOKEN=your_token node ghl/scraper.js
 *
 * Cron example (run daily at 2 AM):
 *   0 2 * * * cd /path/to/AceMedia && APIFY_TOKEN=your_token node ghl/scraper.js >> logs/scraper.log 2>&1
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');
const config = require('./config');

// ---------------------------------------------------------------------------
// HTTP helper (no external dependencies — uses Node built-in https)
// ---------------------------------------------------------------------------

function httpsRequest(options, bodyObj = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let body;
        try { body = JSON.parse(raw); } catch { body = raw; }
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    if (bodyObj !== null) req.write(JSON.stringify(bodyObj));
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// State tracker
// ---------------------------------------------------------------------------

function readTracker() {
  if (!fs.existsSync(config.TRACKER_FILE)) {
    return { lastStateIndex: -1, lastRunDate: null, lastState: null };
  }
  try {
    return JSON.parse(fs.readFileSync(config.TRACKER_FILE, 'utf8'));
  } catch {
    return { lastStateIndex: -1, lastRunDate: null, lastState: null };
  }
}

function writeTracker(data) {
  fs.writeFileSync(config.TRACKER_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function resolveNextState(tracker) {
  const nextIndex = (tracker.lastStateIndex + 1) % config.STATES.length;
  return { state: config.STATES[nextIndex], index: nextIndex };
}

// ---------------------------------------------------------------------------
// Apify API calls
// ---------------------------------------------------------------------------

async function startRun(searchQuery) {
  const input = {
    searchStringsArray: [searchQuery],
    maxCrawledPlacesPerSearch: config.RESULTS_PER_TERM,
    language: 'en',
    exportPlaceUrls: false,
    includeHistogram: false,
    includeOpeningHours: false,
    includePeopleAlsoSearch: false,
    countryCode: 'us',
  };

  const body = JSON.stringify(input);
  const res = await httpsRequest(
    {
      hostname: 'api.apify.com',
      path: `/v2/acts/${config.APIFY_ACTOR_ID}/runs?token=${config.APIFY_TOKEN}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    },
    input
  );

  if (res.status !== 201) {
    throw new Error(`Start run failed (HTTP ${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

async function pollUntilFinished(runId) {
  const deadline = Date.now() + config.RUN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(config.POLL_INTERVAL_MS);
    const res = await httpsRequest({
      hostname: 'api.apify.com',
      path: `/v2/actor-runs/${runId}?token=${config.APIFY_TOKEN}`,
      method: 'GET',
    });

    const runData = res.body?.data;
    const status  = runData?.status;
    console.log(`    [${runId}] status: ${status}`);

    if (status === 'SUCCEEDED') return runData;
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      throw new Error(`Run ${runId} ended with status: ${status}`);
    }
  }
  throw new Error(`Run ${runId} exceeded ${config.RUN_TIMEOUT_MS / 60000} minute timeout`);
}

async function fetchDatasetItems(datasetId) {
  const res = await httpsRequest({
    hostname: 'api.apify.com',
    path: `/v2/datasets/${datasetId}/items?token=${config.APIFY_TOKEN}&format=json&limit=${config.RESULTS_PER_TERM}`,
    method: 'GET',
  });

  if (res.status !== 200) {
    throw new Error(`Fetch dataset failed (HTTP ${res.status}): ${JSON.stringify(res.body)}`);
  }
  return Array.isArray(res.body) ? res.body : [];
}

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

const CSV_COLUMNS = [
  'searchTerm',
  'state',
  'businessName',
  'category',
  'address',
  'city',
  'postalCode',
  'country',
  'phone',
  'website',
  'rating',
  'reviewCount',
  'latitude',
  'longitude',
  'googleMapsUrl',
  'placeId',
];

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value).trim();
  // Wrap in quotes if it contains comma, quote, or newline
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function normalizeItem(raw, searchTerm, state) {
  return {
    searchTerm,
    state,
    businessName:  raw.title        || raw.name            || '',
    category:      raw.categoryName || raw.category        || '',
    address:       raw.address      || raw.street          || '',
    city:          raw.city         || '',
    postalCode:    raw.postalCode   || raw.zip             || '',
    country:       raw.countryCode  || 'US',
    phone:         raw.phone        || raw.phoneUnformatted || '',
    website:       raw.website      || '',
    rating:        raw.totalScore   || raw.rating          || '',
    reviewCount:   raw.reviewsCount || raw.reviewCount     || '',
    latitude:      raw.location?.lat ?? raw.latitude       ?? '',
    longitude:     raw.location?.lng ?? raw.longitude      ?? '',
    googleMapsUrl: raw.url          || raw.googleMapsUrl   || '',
    placeId:       raw.placeId      || '',
  };
}

function buildCSV(records) {
  const header = CSV_COLUMNS.join(',');
  const rows   = records.map((r) => CSV_COLUMNS.map((col) => escapeCell(r[col])).join(','));
  return [header, ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // ── Guards ──────────────────────────────────────────────────────────────
  if (!config.APIFY_TOKEN) {
    console.error('ERROR: APIFY_TOKEN is not set. Export it before running:\n  export APIFY_TOKEN=your_token');
    process.exit(1);
  }

  // ── Resolve today's state ───────────────────────────────────────────────
  const tracker = readTracker();
  const { state, index } = resolveNextState(tracker);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // ── Ensure watched folder exists ────────────────────────────────────────
  fs.mkdirSync(config.WATCHED_FOLDER, { recursive: true });

  console.log('\n========================================');
  console.log(' AceMedia — GHL Daily Lead Scraper');
  console.log('========================================');
  console.log(`  Date        : ${today}`);
  console.log(`  State       : ${state} (slot ${index + 1}/50)`);
  console.log(`  Terms       : ${config.SEARCH_TERMS.join(', ')}`);
  console.log(`  Per term    : ${config.RESULTS_PER_TERM} results`);
  console.log(`  Max total   : ${config.SEARCH_TERMS.length * config.RESULTS_PER_TERM} records`);
  console.log('========================================\n');

  const allRecords = [];

  // ── Scrape each search term ─────────────────────────────────────────────
  for (const term of config.SEARCH_TERMS) {
    const query = `${term} ${state}`;
    console.log(`► Scraping: "${query}"`);

    try {
      const runData      = await startRun(query);
      console.log(`  Run started: ${runData.id}`);

      const finishedRun  = await pollUntilFinished(runData.id);
      const items        = await fetchDatasetItems(finishedRun.defaultDatasetId);
      console.log(`  Results fetched: ${items.length}`);

      for (const item of items) {
        allRecords.push(normalizeItem(item, term, state));
      }
    } catch (err) {
      console.error(`  ERROR — skipping "${query}": ${err.message}`);
    }

    // Brief pause between runs to be polite to the API
    await sleep(2_000);
  }

  // ── Write CSV to watched folder ─────────────────────────────────────────
  const safeName  = state.replace(/\s+/g, '_');
  const filename  = `ghl_leads_${safeName}_${today}.csv`;
  const filepath  = path.join(config.WATCHED_FOLDER, filename);

  fs.writeFileSync(filepath, buildCSV(allRecords), 'utf8');

  console.log('\n========================================');
  console.log(`  CSV saved  : ${filepath}`);
  console.log(`  Records    : ${allRecords.length}`);
  console.log('========================================\n');

  // ── Update state tracker ────────────────────────────────────────────────
  writeTracker({
    lastStateIndex: index,
    lastRunDate:    today,
    lastState:      state,
  });

  console.log(`Tracker updated → next run will use: ${config.STATES[(index + 1) % config.STATES.length]}\n`);
}

main().catch((err) => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
