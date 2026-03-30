'use strict';

const path = require('path');

module.exports = {
  // Set via environment variable: APIFY_TOKEN=your_token node ghl/scraper.js
  APIFY_TOKEN: process.env.APIFY_TOKEN || '',

  // Apify Google Maps Scraper actor
  APIFY_ACTOR_ID: 'compass~google-maps-scraper',

  // Results to extract per search term per day
  RESULTS_PER_TERM: 325,

  // Search terms to run each day
  SEARCH_TERMS: [
    'HVAC',
    'Plumbing',
    'pressure wash',
    'landscaping',
    'home remodeling',
  ],

  // All 50 US states in order — rotated one per day
  STATES: [
    'Alabama',      'Alaska',       'Arizona',      'Arkansas',
    'California',   'Colorado',     'Connecticut',  'Delaware',
    'Florida',      'Georgia',      'Hawaii',       'Idaho',
    'Illinois',     'Indiana',      'Iowa',         'Kansas',
    'Kentucky',     'Louisiana',    'Maine',        'Maryland',
    'Massachusetts','Michigan',     'Minnesota',    'Mississippi',
    'Missouri',     'Montana',      'Nebraska',     'Nevada',
    'New Hampshire','New Jersey',   'New Mexico',   'New York',
    'North Carolina','North Dakota','Ohio',         'Oklahoma',
    'Oregon',       'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee',    'Texas',        'Utah',
    'Vermont',      'Virginia',     'Washington',   'West Virginia',
    'Wisconsin',    'Wyoming',
  ],

  // JSON file that tracks which state was last used
  TRACKER_FILE: path.join(__dirname, 'state-tracker.json'),

  // Folder watched by GHL for CSV imports
  WATCHED_FOLDER: path.join(__dirname, '..', 'watched'),

  // Max time (ms) to wait for a single Apify run to complete (15 min)
  RUN_TIMEOUT_MS: 15 * 60 * 1000,

  // Polling interval (ms) when waiting for Apify run
  POLL_INTERVAL_MS: 10_000,
};
