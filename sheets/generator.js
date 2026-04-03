#!/usr/bin/env node
// AceMedia Google Sheets Template Generator
// Generates 105+ professionally branded XLSX templates for Etsy shop

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const BRAND = require('./brand');

const TEMPLATE_DIR = path.join(__dirname, 'templates');
const OUTPUT_DIR = path.join(__dirname, 'output');

// ─── Styling helpers ────────────────────────────────────────────

function applyBrandHeader(sheet, title, category, colCount) {
  const colors = BRAND.categoryColors[category] || BRAND.categoryColors['budget-finance'];

  // Merge title row
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { ...BRAND.fonts.title, color: { argb: BRAND.colors.white } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.header } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 40;

  // Subtitle row with brand
  sheet.mergeCells(2, 1, 2, colCount);
  const subCell = sheet.getCell('A2');
  subCell.value = `${BRAND.name} — ${BRAND.tagline}`;
  subCell.font = { ...BRAND.fonts.small, italic: true, color: { argb: colors.header } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 22;

  // Empty spacer row
  sheet.getRow(3).height = 8;
}

function applyColumnHeaders(sheet, headers, category, startRow = 4) {
  const colors = BRAND.categoryColors[category] || BRAND.categoryColors['budget-finance'];
  const row = sheet.getRow(startRow);
  row.height = 28;

  headers.forEach((h, i) => {
    const cell = row.getCell(i + 1);
    cell.value = h.label;
    cell.font = { ...BRAND.fonts.subhead, color: { argb: BRAND.colors.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.header } };
    cell.alignment = { horizontal: h.align || 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: BRAND.borders.medium, bottom: BRAND.borders.medium,
      left: BRAND.borders.thin, right: BRAND.borders.thin,
    };
    if (h.width) sheet.getColumn(i + 1).width = h.width;
  });
}

function applyDataRows(sheet, headers, rows, category, startRow = 5) {
  const colors = BRAND.categoryColors[category] || BRAND.categoryColors['budget-finance'];

  rows.forEach((rowData, ri) => {
    const row = sheet.getRow(startRow + ri);
    row.height = 24;
    const isAlt = ri % 2 === 1;

    headers.forEach((h, ci) => {
      const cell = row.getCell(ci + 1);
      const val = rowData[ci];
      cell.value = val;
      cell.font = { ...BRAND.fonts.body };
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: isAlt ? colors.light : BRAND.colors.white },
      };
      cell.alignment = { horizontal: h.align || 'center', vertical: 'middle' };
      cell.border = {
        top: BRAND.borders.thin, bottom: BRAND.borders.thin,
        left: BRAND.borders.thin, right: BRAND.borders.thin,
      };
      if (h.numFmt) cell.numFmt = h.numFmt;
    });
  });
}

function addTotalRow(sheet, headers, formula, category, rowNum) {
  const colors = BRAND.categoryColors[category] || BRAND.categoryColors['budget-finance'];
  const row = sheet.getRow(rowNum);
  row.height = 28;

  headers.forEach((h, ci) => {
    const cell = row.getCell(ci + 1);
    cell.font = { ...BRAND.fonts.subhead, color: { argb: BRAND.colors.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accent } };
    cell.alignment = { horizontal: h.align || 'center', vertical: 'middle' };
    cell.border = {
      top: BRAND.borders.medium, bottom: BRAND.borders.medium,
      left: BRAND.borders.thin, right: BRAND.borders.thin,
    };
    if (h.numFmt) cell.numFmt = h.numFmt;
  });

  // Apply formulas/labels from the formula object
  if (formula) {
    Object.entries(formula).forEach(([colIdx, val]) => {
      const cell = row.getCell(Number(colIdx));
      cell.value = val;
    });
  }
}

function addInstructionSheet(workbook, templateName, instructions, category) {
  const colors = BRAND.categoryColors[category] || BRAND.categoryColors['budget-finance'];
  const sheet = workbook.addWorksheet('Instructions', { properties: { tabColor: { argb: colors.accent } } });

  sheet.getColumn(1).width = 60;
  sheet.mergeCells('A1:A1');
  const title = sheet.getCell('A1');
  title.value = `How to Use: ${templateName}`;
  title.font = { ...BRAND.fonts.title, color: { argb: BRAND.colors.white } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.header } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 40;

  instructions.forEach((text, i) => {
    const cell = sheet.getCell(`A${i + 3}`);
    cell.value = `${i + 1}. ${text}`;
    cell.font = { ...BRAND.fonts.body };
    cell.alignment = { wrapText: true, vertical: 'top' };
    sheet.getRow(i + 3).height = 30;
  });

  const footerRow = instructions.length + 5;
  sheet.getCell(`A${footerRow}`).value = `Made with love by ${BRAND.name} | ${BRAND.website}`;
  sheet.getCell(`A${footerRow}`).font = { ...BRAND.fonts.small, italic: true, color: { argb: colors.header } };
}

function createWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND.name;
  workbook.created = new Date();
  return workbook;
}

async function saveWorkbook(workbook, category, filename) {
  const catDir = path.join(OUTPUT_DIR, category);
  if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });
  const filepath = path.join(catDir, `${filename}.xlsx`);
  await workbook.xlsx.writeFile(filepath);
  return filepath;
}

// ─── Template generation ────────────────────────────────────────

async function generateFromDefinition(def) {
  const workbook = createWorkbook();
  const colors = BRAND.categoryColors[def.category] || BRAND.categoryColors['budget-finance'];

  // Main sheet(s)
  for (const sheetDef of def.sheets) {
    const sheet = workbook.addWorksheet(sheetDef.name, {
      properties: { tabColor: { argb: colors.header } },
    });

    const colCount = sheetDef.headers.length;
    applyBrandHeader(sheet, sheetDef.title || def.title, def.category, colCount);
    applyColumnHeaders(sheet, sheetDef.headers, def.category);
    if (sheetDef.rows && sheetDef.rows.length) {
      applyDataRows(sheet, sheetDef.headers, sheetDef.rows, def.category);
    }
    if (sheetDef.totalRow) {
      const totalRowNum = 5 + (sheetDef.rows ? sheetDef.rows.length : 20);
      addTotalRow(sheet, sheetDef.headers, sheetDef.totalRow, def.category, totalRowNum);
    }

    // Add empty placeholder rows if no sample data
    if (!sheetDef.rows || sheetDef.rows.length === 0) {
      const emptyRows = Array.from({ length: sheetDef.emptyRows || 25 }, () =>
        sheetDef.headers.map(() => '')
      );
      applyDataRows(sheet, sheetDef.headers, emptyRows, def.category);
    }

    // Conditional formatting
    if (sheetDef.conditionalFormatting) {
      sheetDef.conditionalFormatting.forEach(cf => {
        sheet.addConditionalFormatting(cf);
      });
    }

    // Data validation
    if (sheetDef.dataValidation) {
      sheetDef.dataValidation.forEach(dv => {
        sheet.getCell(dv.cell).dataValidation = dv.validation;
      });
    }

    // Freeze panes
    if (sheetDef.freeze) {
      sheet.views = [{ state: 'frozen', xSplit: sheetDef.freeze.col || 0, ySplit: sheetDef.freeze.row || 4 }];
    } else {
      sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];
    }
  }

  // Instructions sheet
  if (def.instructions) {
    addInstructionSheet(workbook, def.title, def.instructions, def.category);
  }

  const filepath = await saveWorkbook(workbook, def.category, def.filename);
  return filepath;
}

// ─── Main execution ─────────────────────────────────────────────

async function main() {
  console.log(`\n  ╔══════════════════════════════════════════════════╗`);
  console.log(`  ║    ${BRAND.name} Google Sheets Template Generator    ║`);
  console.log(`  ║         Etsy Shop Template Collection           ║`);
  console.log(`  ╚══════════════════════════════════════════════════╝\n`);

  // Load all template definitions
  const templateFiles = fs.readdirSync(TEMPLATE_DIR).filter(f => f.endsWith('.js')).sort();
  const targetCategory = process.argv[3]; // --category <name>

  let allDefs = [];
  for (const file of templateFiles) {
    if (file.includes('bundle')) continue; // bundles use bundle-generator.js
    const defs = require(path.join(TEMPLATE_DIR, file));
    const arr = Array.isArray(defs) ? defs : [defs];
    // Only include defs that have a 'sheets' property (skip non-template defs)
    allDefs.push(...arr.filter(d => d.sheets));
  }

  if (targetCategory) {
    allDefs = allDefs.filter(d => d.category === targetCategory);
    console.log(`  Filtering to category: ${targetCategory}`);
  }

  console.log(`  Found ${allDefs.length} template definitions\n`);

  let generated = 0;
  const results = { success: [], errors: [] };

  for (const def of allDefs) {
    try {
      const filepath = await generateFromDefinition(def);
      generated++;
      results.success.push({ name: def.title, path: filepath });
      console.log(`  ✓ [${generated}/${allDefs.length}] ${def.title}`);
    } catch (err) {
      results.errors.push({ name: def.title, error: err.message });
      console.error(`  ✗ ${def.title}: ${err.message}`);
    }
  }

  console.log(`\n  ════════════════════════════════════════════════════`);
  console.log(`  Generated: ${results.success.length} templates`);
  if (results.errors.length) {
    console.log(`  Errors: ${results.errors.length}`);
  }
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log(`  ════════════════════════════════════════════════════\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

module.exports = { generateFromDefinition, createWorkbook, applyBrandHeader, applyColumnHeaders, applyDataRows, addTotalRow, addInstructionSheet, saveWorkbook };
