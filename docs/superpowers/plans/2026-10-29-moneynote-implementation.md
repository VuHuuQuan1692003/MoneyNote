# MoneyNote Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete MoneyNote personal expense tracking web application with HTML5, CSS3, and Vanilla JavaScript & SVG, fulfilling all 12 user requirements with zero external runtime dependencies.

**Architecture:** Multi-file structure (`index.html`, `style.css`, `app.js`). Centralized state management with persistent `localStorage`, strict input validation, pure mathematical SVG Donut Chart rendering, and UTF-8 BOM CSV export for Excel compatibility.

**Tech Stack:** HTML5, CSS3 (Custom Properties & Flex/Grid), Vanilla JavaScript (ES2020+), Inline SVG vector graphics, LocalStorage API, Blob & File API.

**Spec:** [docs/superpowers/specs/2026-10-29-moneynote-design.md](file:///c:/Users/PC/Desktop/AI%20Driven/BT-DEMO-2/docs/superpowers/specs/2026-10-29-moneynote-design.md)

## Global Constraints
- Pure offline functionality (no CDN dependencies, works via direct `file://` opening).
- Vietnamese currency format: `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.
- Green (`#10B981`) for Income (`+`), Red (`#EF4444`) for Expense (`-`).
- Excel export must prepend UTF-8 BOM (`\uFEFF`) to prevent Vietnamese font encoding issues.
- Mobile-first responsiveness with touch target >= 44px and bottom Floating Action Button (FAB).
- Dark/Light mode toggle with persistence in `localStorage`.

## Review Focus
1. **Invalid/Negative Amount Input**: Entering negative numbers, non-numeric strings, or `0` must be rejected with an inline error message and submit button disabled.
2. **Special Characters in Notes for CSV**: Notes containing commas, double quotes, or newlines must be safely escaped (`"note with, comma"`) so Excel columns do not misalign.
3. **Empty Month / No Expense State**: Selecting a month with 0 expenses must show a friendly empty state for the Donut Chart rather than a broken/NaN SVG circle.
4. **Budget Exceeding Calculation**: Total expense > 100% of budget must trigger prominent warning banner and show the exact exceeded amount.
5. **Persistence Integrity**: Editing or deleting a transaction must immediately sync to `localStorage` and keep data intact on browser reload.

---

### Task 1: Semantic HTML Structure & CSS Theme System

**Files:**
- Create: `index.html`
- Create: `style.css`

**Interfaces:**
- Produces: Complete DOM elements with unique IDs for Dashboard cards, Budget progress bar, Filter bar, Transaction list container, SVG Chart wrapper, Modal dialogs (Add/Edit, Delete confirmation, Budget configuration), FAB button, Theme toggle switch.
- CSS Theme: `:root` and `[data-theme="dark"]` custom properties (`--bg-primary`, `--bg-card`, `--text-primary`, `--text-secondary`, `--income-color`, `--expense-color`, `--border-color`, `--shadow`).

- [ ] **Step 1: Create `index.html` with semantic structure**
  - Header: Logo, Theme toggle button (`#theme-toggle-btn`), Export Excel button (`#export-excel-btn`).
  - Dashboard: Summary cards for Total Income (`#total-income`), Total Expense (`#total-expense`), Net Balance (`#net-balance`).
  - Budget Section: Budget card (`#budget-card`), spent vs limit label (`#budget-text`), percentage badge, progress bar (`#budget-progress-bar`), alert message box (`#budget-alert`).
  - Analytics Section: SVG Donut chart container (`#chart-container`), dynamic legend (`#chart-legend`).
  - Filter & Search Toolbar: Month picker (`#filter-month`), Type tabs (`#filter-type`), Category select (`#filter-category`), Search input (`#filter-search`), Reset button (`#btn-reset-filters`).
  - Transaction List: Section header, transaction count badge, list container (`#transaction-list`), empty state template (`#empty-state`).
  - Floating Action Button (FAB): Mobile quick-add button (`#fab-add-btn`).
  - Modals:
    - Add/Edit Modal (`#transaction-modal`): Type toggle (Thu/Chi), Amount input (`#tx-amount`) with real-time VND helper, Category select (`#tx-category`), Date picker (`#tx-date`), Note input (`#tx-note`), Save button, Cancel button.
    - Confirm Delete Dialog (`#delete-confirm-modal`): Message with transaction details, Delete confirm button, Cancel button.
    - Set Budget Modal (`#budget-modal`): Monthly budget input (`#budget-input`), Save button, Cancel button.

- [ ] **Step 2: Create `style.css` with responsive layout and Light/Dark themes**
  - Implement CSS variables for light and dark modes.
  - Implement card layouts with modern rounded corners, subtle shadows, and borders.
  - Implement responsive media queries (`max-width: 768px`) for mobile optimization.
  - Style transactions with green badge for income and red badge for expense.
  - Style custom modal overlays with smooth transitions (`fade-in`, `scale-up`).

- [ ] **Step 3: Verification**
  - Verify `index.html` loads cleanly in browser and links to `style.css` and `app.js`.
  - Verify layout responsiveness and dark theme class switching via developer tools or DOM inspection.

---

### Task 2: State Management, Data Storage & Strict Validation Layer

**Files:**
- Create: `app.js` (Part 1: State, Storage & Validator)
- Create: `test/validator.test.js` (or inline verification script `test-runner.html`)

**Interfaces:**
- Produces:
  - `MoneyNote.State`: Centralized reactive state store.
  - `MoneyNote.Storage`: `getTransactions()`, `saveTransactions()`, `getBudget()`, `saveBudget()`, `getTheme()`, `saveTheme()`, `seedInitialData()`.
  - `MoneyNote.Validator`: `validateTransaction({ type, amount, category, date, note }) -> { isValid, errors }`.
  - `MoneyNote.Utils`: `formatVND(amount)`, `formatDateVN(dateStr)`, `formatDateInput(date)`.

- [ ] **Step 1: Write validation test assertions in `test/test-validator.html`**
  - Test positive amount validation (`100000 -> valid`, `0 -> invalid`, `-50000 -> invalid`, `"abc" -> invalid`).
  - Test required category (`"" -> invalid`, `"Ăn uống" -> valid`).
  - Test date format (`"2026-10-29" -> valid`, `"" -> invalid`).
  - Test note trimming and default assignment.

- [ ] **Step 2: Implement `State`, `Storage`, `Validator`, and `Utils` in `app.js`**
  - `formatVND(number)`: returns formatted VND string (`150.000 ₫`).
  - `Storage.seedInitialData()`: seeds 5-6 realistic sample transactions for the current month if storage is empty.
  - `Validator.validateTransaction(data)`: returns boolean and error dictionary.

- [ ] **Step 3: Verification**
  - Run verification tests to ensure all validator test cases pass.

---

### Task 3: Transaction CRUD & Custom Confirmation Modal

**Files:**
- Modify: `app.js` (Part 2: CRUD operations & UI event binding)

**Interfaces:**
- Consumes: `MoneyNote.State`, `MoneyNote.Storage`, `MoneyNote.Validator`.
- Produces:
  - `MoneyNote.addTransaction(data)`
  - `MoneyNote.updateTransaction(id, data)`
  - `MoneyNote.deleteTransaction(id)`
  - `MoneyNote.openModal(mode, txId)`
  - `MoneyNote.closeModal()`
  - `MoneyNote.renderTransactions(list)`

- [ ] **Step 1: Implement Add & Update transaction handlers**
  - Connect form submission: read inputs, run `Validator.validateTransaction`.
  - Show error messages on invalid fields.
  - On valid: create new transaction object with `id: 'tx_' + Date.now()` or update existing transaction.
  - Save to `localStorage` and trigger UI re-render.

- [ ] **Step 2: Implement Click-to-Edit functionality**
  - Add click event listener to transaction rows.
  - Populate `#transaction-modal` with existing transaction data: type, amount, category, date, note.
  - Update modal title to "Chỉnh sửa giao dịch".

- [ ] **Step 3: Implement Delete with custom confirmation modal**
  - When delete icon is clicked, prevent row edit trigger (`stopPropagation`).
  - Open `#delete-confirm-modal`, display transaction details (Category, Amount, Note).
  - On confirmation: remove transaction from array, persist to `localStorage`, re-render list and dashboard.

- [ ] **Step 4: Verification**
  - Test adding income and expense items.
  - Test editing an existing transaction.
  - Test canceling delete dialog (transaction remains).
  - Test confirming delete dialog (transaction removed).

---

### Task 4: Dashboard Stats & Monthly Budget Alerting

**Files:**
- Modify: `app.js` (Part 3: Summary stats & Budget engine)

**Interfaces:**
- Consumes: `MoneyNote.State.transactions`, `MoneyNote.State.budget`.
- Produces:
  - `MoneyNote.renderDashboard(filteredTransactions)`
  - `MoneyNote.renderBudget(monthlyExpense, budgetLimit)`
  - `MoneyNote.updateBudget(amount)`

- [ ] **Step 1: Implement Dashboard calculations**
  - Filter transactions for the selected month.
  - Calculate `totalIncome = sum(amount)` for `type === 'income'`.
  - Calculate `totalExpense = sum(amount)` for `type === 'expense'`.
  - Calculate `balance = totalIncome - totalExpense`.
  - Render formatted values to `#total-income`, `#total-expense`, `#net-balance`.

- [ ] **Step 2: Implement Budget progress bar and alert system**
  - Calculate `percentage = Math.round((totalExpense / budget) * 100)`.
  - Set progress bar width `min(percentage, 100)%`.
  - Apply colors: green if `< 80%`, warning orange if `80% - 100%`, danger red if `> 100%`.
  - If `> 100%`, show alert banner with message: `⚠️ Cảnh báo: Bạn đã chi tiêu vượt hạn mức [exceeded_amount] ₫!`.

- [ ] **Step 3: Verification**
  - Add expense exceeding budget limit; verify progress bar turns red and alert banner displays exact excess amount.

---

### Task 5: Filtering & Real-time Search by Note

**Files:**
- Modify: `app.js` (Part 4: Filter and search pipeline)

**Interfaces:**
- Produces:
  - `MoneyNote.getFilteredTransactions()`
  - `MoneyNote.bindFilterEvents()`

- [ ] **Step 1: Implement filter logic**
  - Month filter: Match `tx.date.startsWith(selectedMonth)` (e.g. `"2026-10"`).
  - Type filter: Match `all`, `income`, or `expense`.
  - Category filter: Match specific category or `all`.
  - Note search: Case-insensitive search on `tx.note`, normalized for Vietnamese diacritics.

- [ ] **Step 2: Bind filter UI controls with debounced search**
  - Event listeners on `#filter-month`, `#filter-type`, `#filter-category`.
  - Debounce search input listener (200ms) on `#filter-search`.
  - Reset filters button clears search, resets category & type, sets month to current month.

- [ ] **Step 3: Verification**
  - Test typing search keywords in search box; verify only matching transactions render.
  - Test month switching; verify dashboard, budget, chart, and list update synchronously.

---

### Task 6: Pure SVG Donut Chart with Category Breakdown & Tooltips

**Files:**
- Modify: `app.js` (Part 5: SVG Donut Chart rendering engine)

**Interfaces:**
- Produces:
  - `MoneyNote.renderChart(expenses)`: SVG Donut chart generator with hover tooltips and dynamic legend.

- [ ] **Step 1: Implement Category Aggregation**
  - Group expenses for the active month by category.
  - Calculate total for each category and percentage of total monthly expenses.
  - Sort categories by spending descending.

- [ ] **Step 2: Implement Pure SVG Donut Rendering**
  - When total expenses === 0: Render empty state circle with message "Chưa có chi tiêu trong tháng này".
  - When total expenses > 0: Calculate slice angles (`angle = (catTotal / totalExpense) * 360`).
  - Render SVG path arcs with distinct category colors.
  - Add interactive hover/touch tooltip displaying Category Name, Amount in VND, and Percentage.
  - Render center summary: Total Expense formatted in VND.
  - Render Legend list below chart: Category icon/color dot, name, percentage, and total amount.

- [ ] **Step 3: Verification**
  - Test with diverse expense categories; verify SVG segments render full 360° circle correctly without overlaps or NaN errors.
  - Test tooltip display on hover.

---

### Task 7: Excel Export (UTF-8 BOM CSV) & Dark/Light Mode Switcher

**Files:**
- Modify: `app.js` (Part 6: Export & Theme toggle)

**Interfaces:**
- Produces:
  - `MoneyNote.exportToExcel()`: Generates and downloads UTF-8 BOM CSV file.
  - `MoneyNote.toggleTheme()`: Toggles light/dark theme and updates `localStorage`.

- [ ] **Step 1: Implement UTF-8 BOM CSV Export**
  - Build CSV header: `STT,Ngày,Loại,Danh mục,Ghi chú,Số tiền (VNĐ)`.
  - Iterate through active transactions, escape quotes and commas.
  - Prepend `\uFEFF` (Byte Order Mark) to ensure Excel opens Vietnamese characters properly.
  - Create Blob with MIME `text/csv;charset=utf-8;`.
  - Trigger download with filename `MoneyNote_GiaoDich_Thang_MM_YYYY.csv`.

- [ ] **Step 2: Implement Theme Toggle with persistence**
  - Toggle `data-theme="dark"` on `document.documentElement`.
  - Update toggle button icon/text (🌙 / ☀️).
  - Save preference to `localStorage.setItem('moneynote_theme', theme)`.
  - Load saved theme on initial page start.

- [ ] **Step 3: Verification**
  - Export CSV, inspect contents to verify `\uFEFF` BOM and properly escaped Vietnamese text.
  - Toggle theme, refresh page, verify theme state persists.

---

### Task 8: End-to-End Verification across all 12 Functional Requirements

**Files:**
- Review: `index.html`, `style.css`, `app.js`
- Test: `test/test-suite.html` (Automated browser-based test suite verifying all 12 items)

- [ ] **Step 1: Create automated browser test runner `test/test-suite.html`**
  - Tests 1-12 automated or step-by-step verified via programmatic assertions.
- [ ] **Step 2: Execute automated and visual verifications**
  - Requirement 1: Dashboard stats & VND formatting.
  - Requirement 2: Strict validation for add transaction.
  - Requirement 3: Latest transactions on top, green income, red expense.
  - Requirement 4: Click to edit transaction.
  - Requirement 5: Confirm dialog before delete.
  - Requirement 6: Reload persistence in localStorage.
  - Requirement 7: Filter by month, category, type, note search.
  - Requirement 8: Monthly budget limit, progress bar, warning banner.
  - Requirement 9: Pure SVG Donut chart with category percentages.
  - Requirement 10: Mobile responsiveness and touch usability.
  - Requirement 11: Dark/Light mode toggle.
  - Requirement 12: Excel CSV export with UTF-8 BOM.

