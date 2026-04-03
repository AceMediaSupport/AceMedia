#!/usr/bin/env node
// AceMedia Bundle Generator
// Creates combined XLSX workbooks for bundle listings
// Run after generating individual templates: node bundle-generator.js

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const BRAND = require('./brand');
const BUNDLES = require('./templates/08-bundles');

const OUTPUT_DIR = path.join(__dirname, 'output');
const BUNDLE_DIR = path.join(OUTPUT_DIR, 'bundles');

async function generateBundle(bundle) {
  if (!fs.existsSync(BUNDLE_DIR)) fs.mkdirSync(BUNDLE_DIR, { recursive: true });

  // For bundles, we create a ZIP-like folder with all included templates
  // and a cover sheet workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND.name;
  workbook.created = new Date();

  const colors = BRAND.categoryColors[bundle.category] || BRAND.categoryColors['budget-finance'];

  // Cover / Index sheet
  const cover = workbook.addWorksheet('Bundle Index', {
    properties: { tabColor: { argb: colors.header } },
  });

  cover.getColumn(1).width = 50;
  cover.getColumn(2).width = 20;

  // Title
  cover.mergeCells('A1:B1');
  const titleCell = cover.getCell('A1');
  titleCell.value = bundle.title;
  titleCell.font = { ...BRAND.fonts.title, color: { argb: BRAND.colors.white } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.header } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  cover.getRow(1).height = 45;

  // Subtitle
  cover.mergeCells('A2:B2');
  const subCell = cover.getCell('A2');
  subCell.value = `${BRAND.name} — ${BRAND.tagline}`;
  subCell.font = { ...BRAND.fonts.small, italic: true, color: { argb: colors.header } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  cover.getRow(2).height = 25;

  // Description
  cover.getRow(3).height = 10;
  cover.mergeCells('A4:B4');
  cover.getCell('A4').value = bundle.description;
  cover.getCell('A4').font = { ...BRAND.fonts.body };
  cover.getCell('A4').alignment = { wrapText: true };
  cover.getRow(4).height = 40;

  // Included templates header
  cover.getRow(5).height = 10;
  cover.mergeCells('A6:B6');
  const incHeader = cover.getCell('A6');
  incHeader.value = 'Included Templates';
  incHeader.font = { ...BRAND.fonts.heading, color: { argb: BRAND.colors.white } };
  incHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accent } };
  incHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  cover.getRow(6).height = 30;

  // List included files
  const includes = bundle.includes || [];
  includes.forEach((templateId, i) => {
    const row = cover.getRow(7 + i);
    row.height = 24;
    const nameCell = row.getCell(1);
    nameCell.value = `  ${i + 1}. ${templateId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
    nameCell.font = { ...BRAND.fonts.body };
    nameCell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: i % 2 === 0 ? BRAND.colors.white : colors.light },
    };

    const fileCell = row.getCell(2);
    fileCell.value = `${templateId}.xlsx`;
    fileCell.font = { ...BRAND.fonts.small, color: { argb: BRAND.colors.medGray } };
    fileCell.fill = nameCell.fill;
  });

  // Footer
  const footerRow = 7 + includes.length + 2;
  cover.mergeCells(`A${footerRow}:B${footerRow}`);
  cover.getCell(`A${footerRow}`).value = `Thank you for your purchase! — ${BRAND.name} | ${BRAND.website}`;
  cover.getCell(`A${footerRow}`).font = { ...BRAND.fonts.small, italic: true, color: { argb: colors.header } };

  // Price info
  const priceRow = footerRow + 1;
  cover.mergeCells(`A${priceRow}:B${priceRow}`);
  cover.getCell(`A${priceRow}`).value = `Bundle Value: $${bundle.originalPrice} → Your Price: $${bundle.price}`;
  cover.getCell(`A${priceRow}`).font = { ...BRAND.fonts.subhead, color: { argb: colors.accent } };

  const filepath = path.join(BUNDLE_DIR, `${bundle.id}.xlsx`);
  await workbook.xlsx.writeFile(filepath);
  return filepath;
}

async function main() {
  console.log(`\n  ╔══════════════════════════════════════════════════╗`);
  console.log(`  ║       ${BRAND.name} Bundle Generator                 ║`);
  console.log(`  ╚══════════════════════════════════════════════════╝\n`);

  console.log(`  Found ${BUNDLES.length} bundle definitions\n`);

  let generated = 0;
  for (const bundle of BUNDLES) {
    try {
      const filepath = await generateBundle(bundle);
      generated++;
      console.log(`  ✓ [${generated}/${BUNDLES.length}] ${bundle.title} ($${bundle.price})`);
    } catch (err) {
      console.error(`  ✗ ${bundle.title}: ${err.message}`);
    }
  }

  console.log(`\n  Generated ${generated} bundle index files`);
  console.log(`  Output: ${BUNDLE_DIR}\n`);

  // Print pricing summary
  console.log(`  ── Pricing Summary ──────────────────────────────`);
  const themed = BUNDLES.filter(b => !b.tier);
  const mega = BUNDLES.filter(b => b.tier === 'mega');
  const ultimate = BUNDLES.filter(b => b.tier === 'ultimate');

  console.log(`  Themed Bundles (${themed.length}): $${Math.min(...themed.map(b=>b.price))} - $${Math.max(...themed.map(b=>b.price))}`);
  console.log(`  Mega Bundles (${mega.length}): $${Math.min(...mega.map(b=>b.price))} - $${Math.max(...mega.map(b=>b.price))}`);
  console.log(`  Ultimate (${ultimate.length}): $${Math.min(...ultimate.map(b=>b.price))} - $${Math.max(...ultimate.map(b=>b.price))}`);
  console.log(`  ─────────────────────────────────────────────────\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
