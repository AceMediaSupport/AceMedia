// AceMedia Brand Configuration
// Consistent branding across all 105+ Google Sheets templates

const BRAND = {
  name: 'AceMedia',
  tagline: 'Organize Your Life Beautifully',
  website: 'acemediamarketing.net',

  // Primary color palette
  colors: {
    primary:      'FF2D5B6B',  // Deep teal
    primaryLight: 'FF4A8A9B',  // Light teal
    secondary:    'FFF4A261',  // Warm amber/gold
    accent:       'FFE76F51',  // Coral accent
    dark:         'FF264653',  // Dark navy-teal
    light:        'FFEDF6F9',  // Soft ice blue
    white:        'FFFFFFFF',
    offWhite:     'FFF8F9FA',
    lightGray:    'FFE9ECEF',
    medGray:      'FFADB5BD',
    darkGray:     'FF495057',
    black:        'FF212529',
    success:      'FF2A9D8F',  // Green-teal
    warning:      'FFE9C46A',  // Soft yellow
    danger:       'FFE76F51',  // Coral-red
  },

  // Category-specific accent colors
  categoryColors: {
    'budget-finance':     { header: 'FF2D5B6B', accent: 'FF2A9D8F', light: 'FFE0F5F0' },
    'business':           { header: 'FF264653', accent: 'FFF4A261', light: 'FFFFF3E0' },
    'health-fitness':     { header: 'FF2A9D8F', accent: 'FFE76F51', light: 'FFE8F5E9' },
    'home-organization':  { header: 'FF4A8A9B', accent: 'FFF4A261', light: 'FFEDF6F9' },
    'meal-planning':      { header: 'FFE76F51', accent: 'FF2A9D8F', light: 'FFFCE4EC' },
    'travel-events':      { header: 'FFF4A261', accent: 'FF264653', light: 'FFFFF8E1' },
    'student-education':  { header: 'FF5B8DBE', accent: 'FFF4A261', light: 'FFE3F2FD' },
    'productivity-goals': { header: 'FF7B68A5', accent: 'FF2A9D8F', light: 'FFF3E5F5' },
    'family-kids':        { header: 'FFE88D67', accent: 'FF4A8A9B', light: 'FFFFF3E0' },
    'self-care-wellness': { header: 'FFB5838D', accent: 'FF2D5B6B', light: 'FFFCE4EC' },
  },

  // Font configuration (Google Sheets will use these when imported)
  fonts: {
    title:   { name: 'Arial', size: 18, bold: true },
    heading: { name: 'Arial', size: 13, bold: true },
    subhead: { name: 'Arial', size: 11, bold: true },
    body:    { name: 'Arial', size: 10, bold: false },
    small:   { name: 'Arial', size: 9,  bold: false },
  },

  // Border styles
  borders: {
    thin: { style: 'thin', color: { argb: 'FFD0D0D0' } },
    medium: { style: 'medium', color: { argb: 'FFADB5BD' } },
    thick: { style: 'medium', color: { argb: 'FF264653' } },
  },
};

module.exports = BRAND;
