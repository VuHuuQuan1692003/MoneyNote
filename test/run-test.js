// Node.js automated test runner for MoneyNote
const fs = require('fs');
const path = require('path');

// Mock browser globals
global.window = {};
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  documentElement: {
    setAttribute: () => {},
    getAttribute: () => 'light'
  }
};
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

// Read and execute app.js
const appCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf-8');
eval(appCode);

const mn = global.window.MoneyNote;
var MoneyNote = mn;
let passed = 0;
let failed = 0;

function assert(desc, condition, info = '') {
  if (condition) {
    console.log(`[PASS] ${desc}`);
    passed++;
  } else {
    console.error(`[FAIL] ${desc} - ${info}`);
    failed++;
  }
}

console.log('--- Testing MoneyNote Business Logic ---');

// 1. Requirement 1: Currency format
const vndStr = MoneyNote.Utils.formatVND(1500000);
assert('VND currency formatting contains 1.500.000 and symbol', vndStr.includes('1.500.000') && (vndStr.includes('đ') || vndStr.includes('₫')), vndStr);

// 2. Requirement 2: Strict Validation
const vNeg = MoneyNote.Validator.validateTransaction({ type: 'expense', amount: -100, category: 'Ăn uống', date: '2026-10-29' });
assert('Reject negative amount', !vNeg.isValid && !!vNeg.errors.amount);

const vZero = MoneyNote.Validator.validateTransaction({ type: 'expense', amount: 0, category: 'Ăn uống', date: '2026-10-29' });
assert('Reject zero amount', !vZero.isValid && !!vZero.errors.amount);

const vNoCat = MoneyNote.Validator.validateTransaction({ type: 'expense', amount: 50000, category: '', date: '2026-10-29' });
assert('Reject missing category', !vNoCat.isValid && !!vNoCat.errors.category);

const vNoDate = MoneyNote.Validator.validateTransaction({ type: 'expense', amount: 50000, category: 'Ăn uống', date: 'invalid-date' });
assert('Reject invalid date', !vNoDate.isValid && !!vNoDate.errors.date);

const vValid = MoneyNote.Validator.validateTransaction({ type: 'income', amount: 15000000, category: 'Tiền lương', date: '2026-10-29', note: 'Lương' });
assert('Accept valid transaction', vValid.isValid && Object.keys(vValid.errors).length === 0);

// 3. Requirement 1 & 3: Stats calculation
const testTxs = [
  { type: 'income', amount: 20000000, date: '2026-10-01' },
  { type: 'expense', amount: 8000000, date: '2026-10-05' },
  { type: 'expense', amount: 4000000, date: '2026-10-10' }
];
const stats = MoneyNote.calculateStats(testTxs);
assert('Total income equals 20,000,000', stats.totalIncome === 20000000);
assert('Total expense equals 12,000,000', stats.totalExpense === 12000000);
assert('Balance equals 8,000,000', stats.balance === 8000000);

// 4. Requirement 8: Budget progress and alerting
const bSafe = MoneyNote.calculateBudgetProgress(6000000, 10000000);
assert('Budget 60% is safe', bSafe.percent === 60 && bSafe.status === 'safe' && !bSafe.isExceeded);

const bWarn = MoneyNote.calculateBudgetProgress(8500000, 10000000);
assert('Budget 85% is warning', bWarn.percent === 85 && bWarn.status === 'warning' && !bWarn.isExceeded);

const bExceeded = MoneyNote.calculateBudgetProgress(12500000, 10000000);
assert('Budget 125% is danger and exceeded by 2.5M', bExceeded.percent === 125 && bExceeded.status === 'danger' && bExceeded.isExceeded && bExceeded.exceededAmount === 2500000);

// 5. Requirement 12: CSV with UTF-8 BOM and proper escaping
const csv = MoneyNote.generateCSV([
  { id: '1', date: '2026-10-29', type: 'expense', category: 'Ăn uống', note: 'Ăn phở, "bò tái" ngon', amount: 75000 }
]);
assert('CSV starts with UTF-8 BOM \\uFEFF', csv.startsWith('\uFEFF'));
assert('CSV escapes quotes correctly', csv.includes('"Ăn phở, ""bò tái"" ngon"'));
assert('CSV has formatted date', csv.includes('29/10/2026'));

// 6. Requirement 7: Vietnamese diacritic normalization
const norm = MoneyNote.Utils.normalizeVN('Tiền ăn sáng & Cà phê');
assert('Normalizes Vietnamese diacritics', norm === 'tien an sang & ca phe', norm);

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
