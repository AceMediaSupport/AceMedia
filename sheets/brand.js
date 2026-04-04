// LilyPadShopDesigns Brand Configuration
// Consistent branding across all Google Sheets templates
// Lily pad-inspired color palette: soft greens, warm pinks, natural tones

const BRAND = {
  name: 'LilyPad Shop Designs',
  tagline: 'Organize Your Life Beautifully',
  website: 'etsy.com/shop/LilyPadShopDesigns',

  // Primary color palette — Lily pad / botanical inspired
  colors: {
    primary:      'FF4A7C59',  // Lily pad green
    primaryLight: 'FF7DB88A',  // Soft sage green
    secondary:    'FFE8A0BF',  // Soft pink (water lily)
    accent:       'FFD4956A',  // Warm terracotta
    dark:         'FF2C5234',  // Deep forest green
    light:        'FFF0F7F1',  // Pale mint background
    white:        'FFFFFFFF',
    offWhite:     'FFF8FAF8',
    lightGray:    'FFE9ECEF',
    medGray:      'FFADB5BD',
    darkGray:     'FF495057',
    black:        'FF212529',
    success:      'FF5BA67D',  // Fresh green
    warning:      'FFEBC878',  // Soft gold
    danger:       'FFD97070',  // Muted rose
  },

  // Category-specific accent colors
  categoryColors: {
    'budget-finance':     { header: 'FF4A7C59', accent: 'FF5BA67D', light: 'FFECF5EE' },
    'business':           { header: 'FF2C5234', accent: 'FFD4956A', light: 'FFF5EDE4' },
    'health-fitness':     { header: 'FF5BA67D', accent: 'FFE8A0BF', light: 'FFECF5EE' },
    'home-organization':  { header: 'FF7DB88A', accent: 'FFD4956A', light: 'FFF0F7F1' },
    'meal-planning':      { header: 'FFD4956A', accent: 'FF5BA67D', light: 'FFF5EDE4' },
    'travel-events':      { header: 'FF6B9BC0', accent: 'FF4A7C59', light: 'FFEBF2F8' },
    'student-education':  { header: 'FF7A9BBF', accent: 'FFD4956A', light: 'FFEBF2F8' },
    'productivity-goals': { header: 'FF8B7BAD', accent: 'FF5BA67D', light: 'FFF0ECF5' },
    'family-kids':        { header: 'FFE8A0BF', accent: 'FF7DB88A', light: 'FFFDF0F6' },
    'self-care-wellness': { header: 'FFCB8DA0', accent: 'FF4A7C59', light: 'FFFDF0F6' },
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
    thick: { style: 'medium', color: { argb: 'FF2C5234' } },
  },
};

module.exports = BRAND;
