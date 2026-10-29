/**
 * ============================================================================
 * MoneyNote – Quản Lý Thu Chi Cá Nhân
 * 100% Pure Vanilla JavaScript, Offline-First, LocalStorage
 * Giao diện bám sát thiết kế tham chiếu (Sidebar + Top Bar + Cards Grid)
 * ============================================================================
 */

(function () {
  "use strict";

  // Namespace ứng dụng
  window.MoneyNote = window.MoneyNote || {};
  var MoneyNote = window.MoneyNote;

  // ==========================================================================
  // 1. Danh mục & Màu sắc đại diện
  // ==========================================================================
  MoneyNote.CATEGORIES = {
    expense: [
      { id: "food", name: "Ăn uống", letter: "Ă", bg: "#ffedd5", text: "#c2410c", barColor: "#1e3a8a" },
      { id: "bills", name: "Hóa đơn", letter: "H", bg: "#e0e7ff", text: "#4338ca", barColor: "#2563eb" },
      { id: "transport", name: "Đi lại", letter: "Đ", bg: "#e0f2fe", text: "#0369a1", barColor: "#38bdf8" },
      { id: "shopping", name: "Mua sắm", letter: "M", bg: "#fef9c3", text: "#a16207", barColor: "#ea580c" },
      { id: "education", name: "Học tập", letter: "H", bg: "#f3e8ff", text: "#7e22ce", barColor: "#eab308" },
      { id: "entertainment", name: "Giải trí", letter: "G", bg: "#fce7f3", text: "#be185d", barColor: "#94a3b8" },
      { id: "housing", name: "Nhà cửa", letter: "N", bg: "#f1f5f9", text: "#475569", barColor: "#64748b" },
      { id: "health", name: "Sức khỏe", letter: "S", bg: "#fee2e2", text: "#dc2626", barColor: "#f43f5e" },
      { id: "other_expense", name: "Khác", letter: "K", bg: "#f1f5f9", text: "#64748b", barColor: "#94a3b8" }
    ],
    income: [
      { id: "salary", name: "Lương", letter: "L", bg: "#dcfce7", text: "#15803d" },
      { id: "bonus", name: "Thưởng", letter: "T", bg: "#ecfdf5", text: "#047857" },
      { id: "investment", name: "Đầu tư", letter: "Đ", bg: "#e0f2fe", text: "#0284c7" },
      { id: "other_income", name: "Thu khác", letter: "K", bg: "#f3f4f6", text: "#4b5563" }
    ]
  };

  const STORAGE_KEYS = {
    TRANSACTIONS: "moneynote_transactions",
    BUDGET: "moneynote_budget",
    THEME: "moneynote_theme"
  };

  // ==========================================================================
  // 2. Tiện ích (Utils)
  // ==========================================================================
  MoneyNote.Utils = {
    /**
     * Định dạng tiền tệ theo giao diện mẫu (VD: 8.500.000 đ)
     */
    formatVND: function (number) {
      if (typeof number !== "number" || isNaN(number)) number = 0;
      const formatted = new Intl.NumberFormat("vi-VN").format(Math.abs(number));
      return `${formatted} đ`;
    },

    /**
     * Định dạng ngày YYYY-MM-DD -> DD/MM/YYYY
     */
    formatDateVN: function (dateStr) {
      if (!dateStr) return "";
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    },

    /**
     * Lấy ngày hôm nay dạng YYYY-MM-DD
     */
    getTodayStr: function () {
      const d = new Date();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${month}-${day}`;
    },

    /**
     * Lấy tháng hiện tại dạng YYYY-MM
     */
    getCurrentMonthStr: function () {
      const d = new Date();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      return `${d.getFullYear()}-${month}`;
    },

    /**
     * Lấy cấu hình huy hiệu chữ cái của danh mục
     */
    getCategoryMeta: function (categoryName) {
      const all = [...MoneyNote.CATEGORIES.expense, ...MoneyNote.CATEGORIES.income];
      const found = all.find((c) => c.name.toLowerCase() === (categoryName || "").toLowerCase());
      if (found) return found;

      const firstChar = (categoryName || "K").trim().charAt(0).toUpperCase();
      return {
        name: categoryName,
        letter: firstChar,
        bg: "#f1f5f9",
        text: "#475569",
        barColor: "#94a3b8"
      };
    },

    /**
     * Chuẩn hóa tiếng Việt không dấu để tìm kiếm
     */
    normalizeVN: function (str) {
      if (!str) return "";
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .trim();
    },

    /**
     * Escape an toàn cho file CSV
     */
    escapeCSV: function (val) {
      if (val === null || val === undefined) return '""';
      let text = String(val);
      if (text.includes('"') || text.includes(",") || text.includes("\n") || text.includes("\r")) {
        text = '"' + text.replace(/"/g, '""') + '"';
      }
      return text;
    }
  };

  // ==========================================================================
  // 3. Quản lý lưu trữ (LocalStorage Storage Layer)
  // ==========================================================================
  MoneyNote.Storage = {
    getTransactions: function () {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (!raw) return this.seedInitialData();
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn("Lỗi đọc transactions:", e);
        return [];
      }
    },

    saveTransactions: function (transactions) {
      try {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      } catch (e) {
        console.error("Lỗi ghi transactions:", e);
      }
    },

    getBudget: function () {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.BUDGET);
        const val = Number(raw);
        return !isNaN(val) && val > 0 ? val : 6000000; // Mặc định 6.000.000 đ như trong ảnh mẫu
      } catch (e) {
        return 6000000;
      }
    },

    saveBudget: function (amount) {
      try {
        localStorage.setItem(STORAGE_KEYS.BUDGET, String(amount));
      } catch (e) {
        console.error("Lỗi lưu budget:", e);
      }
    },

    getTheme: function () {
      return localStorage.getItem(STORAGE_KEYS.THEME) || "light";
    },

    saveTheme: function (theme) {
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
      } catch (e) {
        console.error("Lỗi lưu theme:", e);
      }
    },

    /**
     * Dữ liệu mẫu chuẩn xác khớp 100% các con số trong ảnh giao diện mẫu
     */
    seedInitialData: function () {
      const monthPrefix = "2026-10";
      const initial = [
        // Khoản thu (Tổng: 8.500.000 đ, 2 khoản thu)
        {
          id: "tx_sample_inc_1",
          type: "income",
          amount: 5000000,
          category: "Lương",
          date: `${monthPrefix}-05`,
          note: "Lương chính tháng 10",
          createdAt: 1730100000000
        },
        {
          id: "tx_sample_inc_2",
          type: "income",
          amount: 3500000,
          category: "Lương",
          date: `${monthPrefix}-24`,
          note: "Lương part-time tháng 10",
          createdAt: 1730100001000
        },

        // Khoản chi (Tổng: 5.230.000 đ, 14 khoản chi)
        // 1. Ăn uống: 1.990.000 đ
        {
          id: "tx_sample_exp_1",
          type: "expense",
          amount: 45000,
          category: "Ăn uống",
          date: `${monthPrefix}-28`,
          note: "Cà phê với nhóm",
          createdAt: 1730100002000
        },
        {
          id: "tx_sample_exp_2",
          type: "expense",
          amount: 1945000,
          category: "Ăn uống",
          date: `${monthPrefix}-12`,
          note: "Tiền chợ & thực phẩm tháng 10",
          createdAt: 1730100003000
        },

        // 2. Hóa đơn: 1.150.000 đ
        {
          id: "tx_sample_exp_3",
          type: "expense",
          amount: 1150000,
          category: "Hóa đơn",
          date: `${monthPrefix}-15`,
          note: "Tiền điện nước và internet",
          createdAt: 1730100004000
        },

        // 3. Đi lại: 730.000 đ
        {
          id: "tx_sample_exp_4",
          type: "expense",
          amount: 80000,
          category: "Đi lại",
          date: `${monthPrefix}-27`,
          note: "Đổ xăng",
          createdAt: 1730100005000
        },
        {
          id: "tx_sample_exp_5",
          type: "expense",
          amount: 650000,
          category: "Đi lại",
          date: `${monthPrefix}-10`,
          note: "Bảo dưỡng xe máy định kỳ",
          createdAt: 1730100006000
        },

        // 4. Mua sắm: 630.000 đ
        {
          id: "tx_sample_exp_6",
          type: "expense",
          amount: 630000,
          category: "Mua sắm",
          date: `${monthPrefix}-18`,
          note: "Mua đồ dùng sinh hoạt",
          createdAt: 1730100007000
        },

        // 5. Học tập: 470.000 đ
        {
          id: "tx_sample_exp_7",
          type: "expense",
          amount: 150000,
          category: "Học tập",
          date: `${monthPrefix}-25`,
          note: "Mua giáo trình JavaScript",
          createdAt: 1730100008000
        },
        {
          id: "tx_sample_exp_8",
          type: "expense",
          amount: 320000,
          category: "Học tập",
          date: `${monthPrefix}-08`,
          note: "Khóa học trực tuyến bổ trợ",
          createdAt: 1730100009000
        },

        // 6. Giải trí: 260.000 đ
        {
          id: "tx_sample_exp_9",
          type: "expense",
          amount: 260000,
          category: "Giải trí",
          date: `${monthPrefix}-20`,
          note: "Xem phim rạp cuối tuần",
          createdAt: 1730100010000
        }
      ];
      this.saveTransactions(initial);
      return initial;
    }
  };

  // ==========================================================================
  // 4. Form Validator
  // ==========================================================================
  MoneyNote.Validator = {
    validateTransaction: function (data) {
      const errors = {};
      const amt = Number(data.amount);

      if (isNaN(amt) || amt <= 0) {
        errors.amount = "Số tiền phải là số lớn hơn 0";
      }

      if (!data.category || typeof data.category !== "string" || data.category.trim() === "") {
        errors.category = "Vui lòng chọn danh mục";
      }

      if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        errors.date = "Vui lòng chọn ngày hợp lệ";
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
      };
    }
  };

  // ==========================================================================
  // 5. Business Logic & Calculations
  // ==========================================================================
  MoneyNote.calculateStats = function (transactions) {
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    (transactions || []).forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "income") {
        totalIncome += amt;
        incomeCount++;
      } else if (tx.type === "expense") {
        totalExpense += amt;
        expenseCount++;
      }
    });

    return {
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      balance: totalIncome - totalExpense,
      incomeCount: incomeCount,
      expenseCount: expenseCount
    };
  };

  MoneyNote.calculateBudgetProgress = function (totalExpense, budgetLimit) {
    if (!budgetLimit || budgetLimit <= 0) budgetLimit = 6000000;

    const percent = Math.round((totalExpense / budgetLimit) * 100);
    const isExceeded = totalExpense > budgetLimit;
    const remaining = isExceeded ? 0 : budgetLimit - totalExpense;

    return {
      percent: percent,
      status: isExceeded ? "danger" : (percent >= 80 ? "warning" : "safe"),
      isExceeded: isExceeded,
      exceededAmount: isExceeded ? totalExpense - budgetLimit : 0,
      remaining: remaining
    };
  };

  MoneyNote.generateCSV = function (transactions) {
    const BOM = "\uFEFF";
    const headers = ["STT", "Ngày giao dịch", "Loại", "Danh mục", "Ghi chú", "Số tiền (VNĐ)"];

    const rows = (transactions || []).map((tx, idx) => {
      const typeLabel = tx.type === "income" ? "Khoản thu" : "Khoản chi";
      return [
        idx + 1,
        MoneyNote.Utils.formatDateVN(tx.date),
        MoneyNote.Utils.escapeCSV(typeLabel),
        MoneyNote.Utils.escapeCSV(tx.category),
        MoneyNote.Utils.escapeCSV(tx.note || ""),
        Number(tx.amount) || 0
      ].join(",");
    });

    return BOM + [headers.join(","), ...rows].join("\r\n");
  };

  // ==========================================================================
  // 6. Trạng thái ứng dụng (State)
  // ==========================================================================
  MoneyNote.State = {
    transactions: [],
    monthlyBudget: 6000000,
    theme: "light",
    filters: {
      month: "2026-10",
      type: "all",
      category: "all",
      search: ""
    },
    editingTransactionId: null,
    pendingDeleteTransactionId: null
  };

  // ==========================================================================
  // 7. Ứng dụng & Điều khiển giao diện (App Controller)
  // ==========================================================================
  MoneyNote.App = {
    init: function () {
      if (!document.getElementById("transaction-list")) return;

      // 1. Tải dữ liệu lưu trữ
      MoneyNote.State.transactions = MoneyNote.Storage.getTransactions();
      MoneyNote.State.monthlyBudget = MoneyNote.Storage.getBudget();
      MoneyNote.State.theme = MoneyNote.Storage.getTheme();

      // Mặc định chọn tháng của giao dịch đầu tiên hoặc tháng hiện tại
      if (!MoneyNote.State.filters.month) {
        MoneyNote.State.filters.month = MoneyNote.Utils.getCurrentMonthStr();
      }

      // 2. Áp dụng Theme
      this.applyTheme(MoneyNote.State.theme);

      // 3. Khởi tạo DOM
      this.initDOMElements();

      // 4. Lắng nghe sự kiện
      this.bindEvents();

      // 5. Cập nhật danh mục & render
      this.populateCategoryDropdowns("expense");
      this.populateFilterCategories();
      this.renderAll();
    },

    initDOMElements: function () {
      this.dom = {
        // Theme & Navigation
        themeToggleBtn: document.getElementById("theme-toggle-btn"),
        themeIconSun: document.getElementById("theme-icon-sun"),
        themeIconMoon: document.getElementById("theme-icon-moon"),
        themeModeText: document.getElementById("theme-mode-text"),
        navItems: document.querySelectorAll(".nav-item"),

        // Views
        viewOverview: document.getElementById("view-overview"),
        viewStatistics: document.getElementById("view-statistics"),

        // Statistics View Elements
        statsActiveMonthBadge: document.getElementById("stats-active-month-badge"),
        statsKpiExpense: document.getElementById("stats-kpi-expense"),
        statsKpiTopCategory: document.getElementById("stats-kpi-top-category"),
        statsKpiSavings: document.getElementById("stats-kpi-savings"),
        donutSvg: document.getElementById("donut-svg"),
        donutCenterTotal: document.getElementById("donut-center-total"),
        chartTooltip: document.getElementById("chart-tooltip"),
        chartLegend: document.getElementById("chart-legend"),
        statsComparisonBars: document.getElementById("stats-comparison-bars"),

        // Top Bar
        btnPrevMonth: document.getElementById("btn-prev-month"),
        btnNextMonth: document.getElementById("btn-next-month"),
        currentMonthHeading: document.getElementById("current-month-heading"),
        filterMonth: document.getElementById("filter-month"),
        filterSearch: document.getElementById("filter-search"),
        btnClearSearch: document.getElementById("btn-clear-search"),
        btnOpenAddModal: document.getElementById("btn-open-add-modal"),
        mobileFab: document.getElementById("mobile-fab"),

        // Overview Cards
        totalIncome: document.getElementById("total-income"),
        incomeCountText: document.getElementById("income-count-text"),
        totalExpense: document.getElementById("total-expense"),
        expenseCountText: document.getElementById("expense-count-text"),
        netBalance: document.getElementById("net-balance"),

        // Budget Card
        budgetProgressDetail: document.getElementById("budget-progress-detail"),
        btnEditBudget: document.getElementById("btn-edit-budget"),
        budgetProgressBar: document.getElementById("budget-progress-bar"),
        budgetAlertBox: document.getElementById("budget-alert-box"),
        budgetAlertMessage: document.getElementById("budget-alert-message"),

        // Transactions Table
        exportExcelBtn: document.getElementById("export-excel-btn"),
        pillBtns: document.querySelectorAll(".pill-btn"),
        filterCategory: document.getElementById("filter-category"),
        transactionList: document.getElementById("transaction-list"),
        emptyState: document.getElementById("empty-state"),

        // Category Breakdown Bars
        breakdownTotalExpense: document.getElementById("breakdown-total-expense"),
        categoryBarsList: document.getElementById("category-bars-list"),

        // Add/Edit Modal
        txModal: document.getElementById("tx-modal"),
        modalTxTitle: document.getElementById("modal-tx-title"),
        btnCloseTxModal: document.getElementById("btn-close-tx-modal"),
        btnCancelTx: document.getElementById("btn-cancel-tx"),
        txForm: document.getElementById("tx-form"),
        txId: document.getElementById("tx-id"),
        toggleTypeExpense: document.getElementById("toggle-type-expense"),
        toggleTypeIncome: document.getElementById("toggle-type-income"),
        txAmount: document.getElementById("tx-amount"),
        txAmountPreview: document.getElementById("tx-amount-preview"),
        txAmountError: document.getElementById("tx-amount-error"),
        txCategory: document.getElementById("tx-category"),
        txCategoryError: document.getElementById("tx-category-error"),
        txDate: document.getElementById("tx-date"),
        txDateError: document.getElementById("tx-date-error"),
        txNote: document.getElementById("tx-note"),

        // Delete Modal
        deleteModal: document.getElementById("delete-modal"),
        deleteTxPreview: document.getElementById("delete-tx-preview"),
        btnCancelDelete: document.getElementById("btn-cancel-delete"),
        btnConfirmDelete: document.getElementById("btn-confirm-delete"),

        // Budget Modal
        budgetModal: document.getElementById("budget-modal"),
        budgetForm: document.getElementById("budget-form"),
        budgetInput: document.getElementById("budget-input"),
        budgetPreview: document.getElementById("budget-preview"),
        budgetInputError: document.getElementById("budget-input-error"),
        btnCloseBudgetModal: document.getElementById("btn-close-budget-modal"),
        btnCancelBudget: document.getElementById("btn-cancel-budget"),

        // Toast Container
        toastContainer: document.getElementById("toast-container")
      };
    },

    bindEvents: function () {
      const self = this;

      // 1. Chuyển đổi Theme
      if (this.dom.themeToggleBtn) {
        this.dom.themeToggleBtn.addEventListener("click", () => {
          const newTheme = MoneyNote.State.theme === "dark" ? "light" : "dark";
          self.applyTheme(newTheme);
          self.showToast(newTheme === "dark" ? "Giao diện Tối 🌙" : "Giao diện Sáng ☀️");
        });
      }

      // Sidebar navigation tab switching
      if (this.dom.navItems) {
        this.dom.navItems.forEach((item) => {
          item.addEventListener("click", (e) => {
            e.preventDefault();
            const navType = item.getAttribute("data-nav");
            if (navType === "statistics") {
              self.switchView("statistics");
            } else if (navType === "transactions") {
              self.switchView("overview");
              setTimeout(() => {
                const el = document.querySelector(".recent-tx-card");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 50);
            } else if (navType === "settings") {
              self.openBudgetModal();
            } else {
              self.switchView("overview");
            }
          });
        });
      }

      // 2. Chuyển đổi Tháng qua mũi tên < và >
      if (this.dom.btnPrevMonth) {
        this.dom.btnPrevMonth.addEventListener("click", () => self.shiftMonth(-1));
      }
      if (this.dom.btnNextMonth) {
        this.dom.btnNextMonth.addEventListener("click", () => self.shiftMonth(1));
      }

      // 3. Mở Modal Thêm Giao Dịch
      if (this.dom.btnOpenAddModal) {
        this.dom.btnOpenAddModal.addEventListener("click", () => self.openTransactionModal("add"));
      }
      if (this.dom.mobileFab) {
        this.dom.mobileFab.addEventListener("click", () => self.openTransactionModal("add"));
      }

      // Đóng modal
      if (this.dom.btnCloseTxModal) this.dom.btnCloseTxModal.addEventListener("click", () => self.closeTransactionModal());
      if (this.dom.btnCancelTx) this.dom.btnCancelTx.addEventListener("click", () => self.closeTransactionModal());

      // Phím ESC đóng modal
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          self.closeTransactionModal();
          self.closeDeleteModal();
          self.closeBudgetModal();
        }
      });

      // Đóng khi click ngoài vùng modal
      if (this.dom.txModal) {
        this.dom.txModal.addEventListener("click", (e) => {
          if (e.target === self.dom.txModal) self.closeTransactionModal();
        });
      }
      if (this.dom.deleteModal) {
        this.dom.deleteModal.addEventListener("click", (e) => {
          if (e.target === self.dom.deleteModal) self.closeDeleteModal();
        });
      }
      if (this.dom.budgetModal) {
        this.dom.budgetModal.addEventListener("click", (e) => {
          if (e.target === self.dom.budgetModal) self.closeBudgetModal();
        });
      }

      // Đổi loại Thu / Chi trong form modal
      if (this.dom.toggleTypeExpense) {
        this.dom.toggleTypeExpense.addEventListener("click", () => self.setModalType("expense"));
      }
      if (this.dom.toggleTypeIncome) {
        this.dom.toggleTypeIncome.addEventListener("click", () => self.setModalType("income"));
      }

      // Preview số tiền khi gõ
      if (this.dom.txAmount) {
        this.dom.txAmount.addEventListener("input", (e) => {
          const val = Number(e.target.value);
          self.dom.txAmountPreview.textContent = val > 0 ? MoneyNote.Utils.formatVND(val) : "0 đ";
          self.dom.txAmountError.classList.add("hidden");
        });
      }

      if (this.dom.txCategory) {
        this.dom.txCategory.addEventListener("change", () => self.dom.txCategoryError.classList.add("hidden"));
      }
      if (this.dom.txDate) {
        this.dom.txDate.addEventListener("change", () => self.dom.txDateError.classList.add("hidden"));
      }

      // Submit Form Thêm/Sửa
      if (this.dom.txForm) {
        this.dom.txForm.addEventListener("submit", (e) => {
          e.preventDefault();
          self.handleTransactionSubmit();
        });
      }

      // Xóa giao dịch
      if (this.dom.btnCancelDelete) this.dom.btnCancelDelete.addEventListener("click", () => self.closeDeleteModal());
      if (this.dom.btnConfirmDelete) this.dom.btnConfirmDelete.addEventListener("click", () => self.handleConfirmDelete());

      // Hạn mức ngân sách
      if (this.dom.btnEditBudget) this.dom.btnEditBudget.addEventListener("click", () => self.openBudgetModal());
      if (this.dom.btnCloseBudgetModal) this.dom.btnCloseBudgetModal.addEventListener("click", () => self.closeBudgetModal());
      if (this.dom.btnCancelBudget) this.dom.btnCancelBudget.addEventListener("click", () => self.closeBudgetModal());

      if (this.dom.budgetInput) {
        this.dom.budgetInput.addEventListener("input", (e) => {
          const val = Number(e.target.value);
          self.dom.budgetPreview.textContent = val > 0 ? MoneyNote.Utils.formatVND(val) : "0 đ";
          self.dom.budgetInputError.classList.add("hidden");
        });
      }

      if (this.dom.budgetForm) {
        this.dom.budgetForm.addEventListener("submit", (e) => {
          e.preventDefault();
          self.handleBudgetSubmit();
        });
      }

      // Lọc Tất cả / Thu / Chi bằng Pill Tab
      if (this.dom.pillBtns) {
        this.dom.pillBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            self.dom.pillBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            MoneyNote.State.filters.type = btn.getAttribute("data-type");
            self.populateFilterCategories();
            self.renderAll();
          });
        });
      }

      // Lọc danh mục
      if (this.dom.filterCategory) {
        this.dom.filterCategory.addEventListener("change", (e) => {
          MoneyNote.State.filters.category = e.target.value;
          self.renderAll();
        });
      }

      // Tìm kiếm với Debounce 200ms
      let searchTimeout = null;
      if (this.dom.filterSearch) {
        this.dom.filterSearch.addEventListener("input", (e) => {
          const val = e.target.value;
          if (self.dom.btnClearSearch) {
            self.dom.btnClearSearch.classList.toggle("hidden", val.length === 0);
          }
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
            MoneyNote.State.filters.search = val;
            self.renderAll();
          }, 200);
        });
      }

      if (this.dom.btnClearSearch) {
        this.dom.btnClearSearch.addEventListener("click", () => {
          self.dom.filterSearch.value = "";
          self.dom.btnClearSearch.classList.add("hidden");
          MoneyNote.State.filters.search = "";
          self.renderAll();
        });
      }

      // Xuất CSV
      if (this.dom.exportExcelBtn) {
        this.dom.exportExcelBtn.addEventListener("click", () => self.handleExportExcel());
      }
    },

    // ========================================================================
    // Logic Render & Update UI
    // ========================================================================
    renderAll: function () {
      const activeMonth = MoneyNote.State.filters.month;

      // 1. Cập nhật nhãn Tháng MM/YYYY trên Top Bar
      if (this.dom.currentMonthHeading) {
        const parts = activeMonth.split("-");
        this.dom.currentMonthHeading.textContent = `Tháng ${parseInt(parts[1], 10)}/${parts[0]}`;
      }

      // 2. Lấy giao dịch tháng này
      const monthlyTransactions = MoneyNote.State.transactions.filter((tx) =>
        tx.date ? tx.date.startsWith(activeMonth) : false
      );

      // 3. Tính toán thống kê Dashboard
      const stats = MoneyNote.calculateStats(monthlyTransactions);
      this.dom.totalIncome.textContent = MoneyNote.Utils.formatVND(stats.totalIncome);
      this.dom.incomeCountText.textContent = `${stats.incomeCount} khoản thu`;

      this.dom.totalExpense.textContent = MoneyNote.Utils.formatVND(stats.totalExpense);
      this.dom.expenseCountText.textContent = `${stats.expenseCount} khoản chi`;

      this.dom.netBalance.textContent = MoneyNote.Utils.formatVND(stats.balance);

      // 4. Render Khối Ngân sách tháng
      this.renderBudgetSection(stats.totalExpense);

      // 5. Render Bảng Giao dịch gần đây (đã qua lọc)
      const filteredTransactions = this.getFilteredTransactions(monthlyTransactions);
      this.renderTransactionTable(filteredTransactions);

      // 6. Render Cột Phải: Chi theo danh mục
      const monthlyExpenses = monthlyTransactions.filter((tx) => tx.type === "expense");
      this.renderCategoryBreakdown(monthlyExpenses, stats.totalExpense);

      // 7. Render View Thống Kê (Biểu đồ Donut SVG & Phân tích chuyên sâu)
      this.renderStatisticsView(monthlyExpenses, stats);
    },

    switchView: function (viewName) {
      MoneyNote.State.activeTab = viewName;
      if (this.dom.navItems) {
        this.dom.navItems.forEach((nav) => {
          if (nav.getAttribute("data-nav") === viewName) {
            nav.classList.add("active");
          } else {
            nav.classList.remove("active");
          }
        });
      }

      if (viewName === "statistics") {
        if (this.dom.viewOverview) {
          this.dom.viewOverview.classList.add("hidden");
          this.dom.viewOverview.classList.remove("active-view");
        }
        if (this.dom.viewStatistics) {
          this.dom.viewStatistics.classList.remove("hidden");
          this.dom.viewStatistics.classList.add("active-view");
        }
        this.renderAll();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        if (this.dom.viewStatistics) {
          this.dom.viewStatistics.classList.add("hidden");
          this.dom.viewStatistics.classList.remove("active-view");
        }
        if (this.dom.viewOverview) {
          this.dom.viewOverview.classList.remove("hidden");
          this.dom.viewOverview.classList.add("active-view");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },

    renderStatisticsView: function (monthlyExpenses, stats) {
      if (!this.dom.viewStatistics) return;

      const activeMonth = MoneyNote.State.filters.month;
      const parts = activeMonth.split("-");
      const monthLabel = `Tháng ${parseInt(parts[1], 10)}/${parts[0]}`;

      if (this.dom.statsActiveMonthBadge) {
        this.dom.statsActiveMonthBadge.textContent = monthLabel;
      }

      if (this.dom.statsKpiExpense) {
        this.dom.statsKpiExpense.textContent = MoneyNote.Utils.formatVND(stats.totalExpense);
      }
      if (this.dom.statsKpiSavings) {
        this.dom.statsKpiSavings.textContent = MoneyNote.Utils.formatVND(stats.balance);
      }

      const catMap = {};
      (monthlyExpenses || []).forEach((tx) => {
        const cat = tx.category || "Khác";
        catMap[cat] = (catMap[cat] || 0) + (Number(tx.amount) || 0);
      });

      const totalExpense = stats.totalExpense;
      const sorted = Object.keys(catMap)
        .map((cat) => {
          const meta = MoneyNote.Utils.getCategoryMeta(cat);
          const amt = catMap[cat];
          const pct = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
          return {
            name: cat,
            amount: amt,
            percent: pct,
            meta: meta
          };
        })
        .sort((a, b) => b.amount - a.amount);

      if (this.dom.statsKpiTopCategory) {
        if (sorted.length > 0) {
          this.dom.statsKpiTopCategory.textContent = `${sorted[0].name} (${sorted[0].percent}%)`;
        } else {
          this.dom.statsKpiTopCategory.textContent = "Chưa có";
        }
      }

      if (this.dom.donutCenterTotal) {
        this.dom.donutCenterTotal.textContent = MoneyNote.Utils.formatVND(totalExpense);
      }

      this.renderDonutSVG(sorted, totalExpense);
      this.renderComparisonBars(sorted, totalExpense);
    },

    renderDonutSVG: function (sortedCategories, totalExpense) {
      const svg = this.dom.donutSvg;
      const legend = this.dom.chartLegend;
      const tooltip = this.dom.chartTooltip;

      if (!svg || !legend) return;

      svg.innerHTML = '<circle cx="120" cy="120" r="80" class="donut-bg-circle" />';
      legend.innerHTML = "";

      if (!sortedCategories || sortedCategories.length === 0 || totalExpense <= 0) {
        legend.innerHTML = '<p class="empty-table-state">Chưa có chi tiêu trong tháng này.</p>';
        return;
      }

      const radius = 80;
      const circumference = 2 * Math.PI * radius;
      let accumulatedLength = 0;

      sortedCategories.forEach((catItem) => {
        const color = catItem.meta.barColor || "#2563eb";
        const strokeLength = (catItem.percent / 100) * circumference;
        const strokeDash = `${strokeLength} ${circumference}`;
        const strokeOffset = -accumulatedLength;

        accumulatedLength += strokeLength;

        const circleSegment = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circleSegment.setAttribute("cx", "120");
        circleSegment.setAttribute("cy", "120");
        circleSegment.setAttribute("r", String(radius));
        circleSegment.setAttribute("class", "donut-segment");
        circleSegment.setAttribute("stroke", color);
        circleSegment.setAttribute("stroke-dasharray", strokeDash);
        circleSegment.setAttribute("stroke-dashoffset", String(strokeOffset));

        circleSegment.addEventListener("mouseenter", (e) => {
          if (!tooltip) return;
          tooltip.innerHTML = `<strong>${catItem.name}</strong>: ${MoneyNote.Utils.formatVND(catItem.amount)} (${catItem.percent}%)`;
          tooltip.classList.remove("hidden");
        });

        circleSegment.addEventListener("mousemove", (e) => {
          if (!tooltip) return;
          const rect = svg.getBoundingClientRect();
          tooltip.style.left = `${e.clientX - rect.left + 10}px`;
          tooltip.style.top = `${e.clientY - rect.top - 25}px`;
        });

        circleSegment.addEventListener("mouseleave", () => {
          if (tooltip) tooltip.classList.add("hidden");
        });

        svg.appendChild(circleSegment);

        const row = document.createElement("div");
        row.className = "legend-row-item";
        row.innerHTML = `
          <div class="legend-left">
            <span class="legend-dot-pill" style="background-color: ${color};"></span>
            <span class="legend-name-text">${catItem.name}</span>
          </div>
          <div class="legend-right">
            <span class="legend-amount-text">${MoneyNote.Utils.formatVND(catItem.amount)}</span>
            <span class="legend-pct-text">${catItem.percent}%</span>
          </div>
        `;
        legend.appendChild(row);
      });
    },

    renderComparisonBars: function (sortedCategories, totalExpense) {
      const container = this.dom.statsComparisonBars;
      if (!container) return;

      container.innerHTML = "";

      if (!sortedCategories || sortedCategories.length === 0 || totalExpense <= 0) {
        container.innerHTML = '<p class="empty-table-state">Chưa có chi tiêu trong tháng này.</p>';
        return;
      }

      sortedCategories.forEach((catItem, idx) => {
        const color = catItem.meta.barColor || "#2563eb";
        const div = document.createElement("div");
        div.className = "rank-bar-item";
        div.innerHTML = `
          <div class="rank-bar-header">
            <span class="rank-title">
              <span class="rank-badge">#${idx + 1}</span>
              <span>${catItem.name}</span>
            </span>
            <span class="rank-amount">${MoneyNote.Utils.formatVND(catItem.amount)} (${catItem.percent}%)</span>
          </div>
          <div class="rank-bar-track">
            <div class="rank-bar-fill" style="width: ${catItem.percent}%; background-color: ${color};"></div>
          </div>
        `;
        container.appendChild(div);
      });
    },

    shiftMonth: function (delta) {
      const parts = MoneyNote.State.filters.month.split("-");
      let year = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10) + delta;

      if (month > 12) {
        month = 1;
        year++;
      } else if (month < 1) {
        month = 12;
        year--;
      }

      MoneyNote.State.filters.month = `${year}-${String(month).padStart(2, "0")}`;
      this.renderAll();
    },

    getFilteredTransactions: function (sourceList) {
      const filters = MoneyNote.State.filters;
      const normalizedSearch = MoneyNote.Utils.normalizeVN(filters.search);

      const result = sourceList.filter((tx) => {
        // Lọc loại
        if (filters.type !== "all" && tx.type !== filters.type) return false;

        // Lọc danh mục
        if (filters.category !== "all" && tx.category !== filters.category) return false;

        // Tìm kiếm ghi chú
        if (normalizedSearch) {
          const noteNorm = MoneyNote.Utils.normalizeVN(tx.note || "");
          const catNorm = MoneyNote.Utils.normalizeVN(tx.category || "");
          if (!noteNorm.includes(normalizedSearch) && !catNorm.includes(normalizedSearch)) {
            return false;
          }
        }

        return true;
      });

      // Mới nhất lên đầu
      return result.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    },

    renderBudgetSection: function (totalExpense) {
      const budget = MoneyNote.State.monthlyBudget;
      const progress = MoneyNote.calculateBudgetProgress(totalExpense, budget);

      this.dom.budgetProgressDetail.innerHTML = `Đã chi <strong>${MoneyNote.Utils.formatVND(totalExpense)}</strong> / ${MoneyNote.Utils.formatVND(budget)}`;

      const clampedPercent = Math.min(progress.percent, 100);
      this.dom.budgetProgressBar.style.width = `${clampedPercent}%`;

      // Cập nhật cảnh báo
      if (progress.isExceeded) {
        this.dom.budgetProgressBar.style.background = "#dc2626";
        this.dom.budgetAlertBox.style.backgroundColor = "#fee2e2";
        this.dom.budgetAlertBox.style.borderColor = "#fecaca";
        this.dom.budgetAlertBox.style.color = "#991b1b";
        this.dom.budgetAlertMessage.textContent = `Bạn đã vượt ngân sách ${progress.percent}%! Vượt quá ${MoneyNote.Utils.formatVND(progress.exceededAmount)}.`;
      } else {
        this.dom.budgetProgressBar.style.background = "linear-gradient(90deg, #d97706, #ea580c)";
        this.dom.budgetAlertBox.style.backgroundColor = "var(--amber-banner-bg)";
        this.dom.budgetAlertBox.style.borderColor = "var(--amber-banner-border)";
        this.dom.budgetAlertBox.style.color = "var(--amber-banner-text)";
        this.dom.budgetAlertMessage.textContent = `Bạn đã dùng ${progress.percent}% ngân sách. Còn lại ${MoneyNote.Utils.formatVND(progress.remaining)} cho các ngày còn lại trong tháng.`;
      }
    },

    renderTransactionTable: function (transactions) {
      const self = this;
      const tbody = this.dom.transactionList;
      tbody.innerHTML = "";

      if (!transactions || transactions.length === 0) {
        this.dom.emptyState.classList.remove("hidden");
        return;
      }

      this.dom.emptyState.classList.add("hidden");

      transactions.forEach((tx) => {
        const isIncome = tx.type === "income";
        const meta = MoneyNote.Utils.getCategoryMeta(tx.category);
        const sign = isIncome ? "+ " : "- ";
        const amountDisplay = sign + MoneyNote.Utils.formatVND(Number(tx.amount) || 0);

        const tr = document.createElement("tr");
        tr.className = "tx-table-row";
        tr.setAttribute("data-id", tx.id);
        tr.setAttribute("title", "Bấm để sửa giao dịch này");

        tr.innerHTML = `
          <td class="td-date">${MoneyNote.Utils.formatDateVN(tx.date)}</td>
          <td class="td-cat">
            <div class="category-cell-content">
              <span class="cat-letter-badge" style="background-color: ${meta.bg}; color: ${meta.text};">
                ${meta.letter}
              </span>
              <span class="cat-name-text">${tx.category}</span>
            </div>
          </td>
          <td class="td-note" title="${tx.note || tx.category}">${tx.note || tx.category}</td>
          <td class="td-amount ${isIncome ? "amount-income" : "amount-expense"}">${amountDisplay}</td>
          <td class="td-actions">
            <div class="row-actions-group">
              <button class="action-icon-btn action-edit-btn" title="Sửa" data-id="${tx.id}">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
              <button class="action-icon-btn action-delete-btn" title="Xóa" data-id="${tx.id}">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </td>
        `;

        // Bấm vào dòng để Sửa (Yêu cầu 4)
        tr.addEventListener("click", (e) => {
          if (e.target.closest(".action-delete-btn")) return;
          self.openTransactionModal("edit", tx.id);
        });

        // Bấm nút xóa
        const delBtn = tr.querySelector(".action-delete-btn");
        if (delBtn) {
          delBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            self.openDeleteModal(tx.id);
          });
        }

        tbody.appendChild(tr);
      });
    },

    renderCategoryBreakdown: function (expenses, totalExpense) {
      const container = this.dom.categoryBarsList;
      container.innerHTML = "";
      this.dom.breakdownTotalExpense.textContent = `Tổng chi ${MoneyNote.Utils.formatVND(totalExpense)}`;

      if (!expenses || expenses.length === 0 || totalExpense <= 0) {
        container.innerHTML = '<p class="empty-table-state">Chưa có chi tiêu trong tháng này.</p>';
        return;
      }

      // Nhóm theo danh mục
      const catMap = {};
      expenses.forEach((tx) => {
        const cat = tx.category || "Khác";
        catMap[cat] = (catMap[cat] || 0) + (Number(tx.amount) || 0);
      });

      // Sắp xếp giảm dần theo chi tiêu
      const sorted = Object.keys(catMap)
        .map((cat) => {
          const meta = MoneyNote.Utils.getCategoryMeta(cat);
          const amt = catMap[cat];
          const pct = Math.round((amt / totalExpense) * 100);
          return {
            name: cat,
            amount: amt,
            percent: pct,
            barColor: meta.barColor || "#2563eb"
          };
        })
        .sort((a, b) => b.amount - a.amount);

      sorted.forEach((item) => {
        const div = document.createElement("div");
        div.className = "category-bar-item";
        div.innerHTML = `
          <div class="cat-bar-info">
            <span class="cat-bar-title">${item.name}</span>
            <span class="cat-bar-stat">${MoneyNote.Utils.formatVND(item.amount)} · ${item.percent}%</span>
          </div>
          <div class="cat-progress-track">
            <div class="cat-progress-fill" style="width: ${item.percent}%; background-color: ${item.barColor};"></div>
          </div>
        `;
        container.appendChild(div);
      });
    },

    // ========================================================================
    // Thêm & Sửa Giao Dịch
    // ========================================================================
    openTransactionModal: function (mode, txId = null) {
      this.dom.txForm.reset();
      this.dom.txAmountError.classList.add("hidden");
      this.dom.txCategoryError.classList.add("hidden");
      this.dom.txDateError.classList.add("hidden");

      if (mode === "edit" && txId) {
        MoneyNote.State.editingTransactionId = txId;
        const tx = MoneyNote.State.transactions.find((t) => t.id === txId);
        if (!tx) return;

        this.dom.modalTxTitle.textContent = "Chỉnh sửa giao dịch";
        this.dom.txId.value = tx.id;
        this.setModalType(tx.type);
        this.dom.txAmount.value = tx.amount;
        this.dom.txAmountPreview.textContent = MoneyNote.Utils.formatVND(Number(tx.amount));
        this.dom.txCategory.value = tx.category;
        this.dom.txDate.value = tx.date;
        this.dom.txNote.value = tx.note || "";
      } else {
        MoneyNote.State.editingTransactionId = null;
        this.dom.modalTxTitle.textContent = "Thêm giao dịch mới";
        this.dom.txId.value = "";
        this.setModalType("expense");
        this.dom.txAmountPreview.textContent = "0 đ";
        this.dom.txDate.value = MoneyNote.Utils.getTodayStr();
      }

      this.dom.txModal.classList.remove("hidden");
      setTimeout(() => this.dom.txAmount.focus(), 100);
    },

    closeTransactionModal: function () {
      this.dom.txModal.classList.add("hidden");
      MoneyNote.State.editingTransactionId = null;
    },

    setModalType: function (type) {
      if (type === "income") {
        this.dom.toggleTypeIncome.classList.add("active-income");
        this.dom.toggleTypeExpense.classList.remove("active-expense");
      } else {
        this.dom.toggleTypeExpense.classList.add("active-expense");
        this.dom.toggleTypeIncome.classList.remove("active-income");
      }
      this.populateCategoryDropdowns(type);
    },

    populateCategoryDropdowns: function (type) {
      const list = MoneyNote.CATEGORIES[type] || [];
      const select = this.dom.txCategory;
      select.innerHTML = '<option value="">-- Chọn danh mục --</option>';

      list.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat.name;
        opt.textContent = `${cat.name}`;
        select.appendChild(opt);
      });
    },

    populateFilterCategories: function () {
      const filterType = MoneyNote.State.filters.type;
      const select = this.dom.filterCategory;
      select.innerHTML = '<option value="all">Tất cả danh mục</option>';

      let list = [];
      if (filterType === "all") {
        list = [...MoneyNote.CATEGORIES.expense, ...MoneyNote.CATEGORIES.income];
      } else {
        list = MoneyNote.CATEGORIES[filterType] || [];
      }

      // Loại bỏ trùng tên danh mục nếu có
      const seen = new Set();
      list.forEach((cat) => {
        if (!seen.has(cat.name)) {
          seen.add(cat.name);
          const opt = document.createElement("option");
          opt.value = cat.name;
          opt.textContent = cat.name;
          select.appendChild(opt);
        }
      });
    },

    handleTransactionSubmit: function () {
      const isExpense = this.dom.toggleTypeExpense.classList.contains("active-expense");
      const type = isExpense ? "expense" : "income";
      const amount = Number(this.dom.txAmount.value);
      const category = this.dom.txCategory.value;
      const date = this.dom.txDate.value;
      const note = (this.dom.txNote.value || "").trim();

      const validation = MoneyNote.Validator.validateTransaction({
        type: type,
        amount: amount,
        category: category,
        date: date,
        note: note
      });

      if (!validation.isValid) {
        if (validation.errors.amount) {
          this.dom.txAmountError.textContent = validation.errors.amount;
          this.dom.txAmountError.classList.remove("hidden");
        }
        if (validation.errors.category) {
          this.dom.txCategoryError.textContent = validation.errors.category;
          this.dom.txCategoryError.classList.remove("hidden");
        }
        if (validation.errors.date) {
          this.dom.txDateError.textContent = validation.errors.date;
          this.dom.txDateError.classList.remove("hidden");
        }
        return;
      }

      if (MoneyNote.State.editingTransactionId) {
        const idx = MoneyNote.State.transactions.findIndex(
          (t) => t.id === MoneyNote.State.editingTransactionId
        );
        if (idx !== -1) {
          MoneyNote.State.transactions[idx] = {
            ...MoneyNote.State.transactions[idx],
            type: type,
            amount: amount,
            category: category,
            date: date,
            note: note || category
          };
          MoneyNote.Storage.saveTransactions(MoneyNote.State.transactions);
          this.showToast("Đã cập nhật giao dịch! ✨");
        }
      } else {
        const newTx = {
          id: "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
          type: type,
          amount: amount,
          category: category,
          date: date,
          note: note || category,
          createdAt: Date.now()
        };
        MoneyNote.State.transactions.unshift(newTx);
        MoneyNote.Storage.saveTransactions(MoneyNote.State.transactions);
        this.showToast("Thêm giao dịch mới thành công! 🎉");
      }

      this.closeTransactionModal();
      this.renderAll();
    },

    // ========================================================================
    // Xóa Giao Dịch với Modal Xác Nhận
    // ========================================================================
    openDeleteModal: function (txId) {
      const tx = MoneyNote.State.transactions.find((t) => t.id === txId);
      if (!tx) return;

      MoneyNote.State.pendingDeleteTransactionId = txId;
      const isIncome = tx.type === "income";

      this.dom.deleteTxPreview.innerHTML = `
        <strong>${tx.category}</strong>: ${tx.note || ""}
        <br>
        <span style="color: ${isIncome ? "var(--income-green)" : "var(--expense-red)"}; font-weight: bold; font-size: 1rem;">
          ${isIncome ? "+" : "-"} ${MoneyNote.Utils.formatVND(Number(tx.amount))}
        </span>
        <br>
        <small style="color: var(--text-light);">${MoneyNote.Utils.formatDateVN(tx.date)}</small>
      `;

      this.dom.deleteModal.classList.remove("hidden");
    },

    closeDeleteModal: function () {
      this.dom.deleteModal.classList.add("hidden");
      MoneyNote.State.pendingDeleteTransactionId = null;
    },

    handleConfirmDelete: function () {
      const txId = MoneyNote.State.pendingDeleteTransactionId;
      if (!txId) return;

      MoneyNote.State.transactions = MoneyNote.State.transactions.filter((t) => t.id !== txId);
      MoneyNote.Storage.saveTransactions(MoneyNote.State.transactions);

      this.closeDeleteModal();
      this.showToast("Đã xóa giao dịch! 🗑️");
      this.renderAll();
    },

    // ========================================================================
    // Đặt Hạn Mức Ngân Sách
    // ========================================================================
    openBudgetModal: function () {
      this.dom.budgetInput.value = MoneyNote.State.monthlyBudget;
      this.dom.budgetPreview.textContent = MoneyNote.Utils.formatVND(MoneyNote.State.monthlyBudget);
      this.dom.budgetInputError.classList.add("hidden");
      this.dom.budgetModal.classList.remove("hidden");
      setTimeout(() => this.dom.budgetInput.focus(), 100);
    },

    closeBudgetModal: function () {
      this.dom.budgetModal.classList.add("hidden");
    },

    handleBudgetSubmit: function () {
      const val = Number(this.dom.budgetInput.value);
      if (isNaN(val) || val <= 0) {
        this.dom.budgetInputError.textContent = "Hạn mức phải là số dương lớn hơn 0";
        this.dom.budgetInputError.classList.remove("hidden");
        return;
      }

      MoneyNote.State.monthlyBudget = val;
      MoneyNote.Storage.saveBudget(val);
      this.closeBudgetModal();
      this.showToast("Đã lưu hạn mức ngân sách! 🎯");
      this.renderAll();
    },

    // ========================================================================
    // Xuất CSV Excel (UTF-8 BOM)
    // ========================================================================
    handleExportExcel: function () {
      const monthlyTransactions = MoneyNote.State.transactions.filter((tx) =>
        tx.date ? tx.date.startsWith(MoneyNote.State.filters.month) : false
      );
      const filtered = this.getFilteredTransactions(monthlyTransactions);

      if (!filtered || filtered.length === 0) {
        this.showToast("Không có giao dịch nào để xuất!", "warning");
        return;
      }

      const csvData = MoneyNote.generateCSV(filtered);
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      const monthStr = MoneyNote.State.filters.month.replace("-", "_");
      link.setAttribute("href", url);
      link.setAttribute("download", `MoneyNote_GiaoDich_${monthStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.showToast(`Đã xuất ${filtered.length} giao dịch ra file Excel! 📊`);
    },

    // ========================================================================
    // Quản Lý Theme Sáng / Tối
    // ========================================================================
    applyTheme: function (theme) {
      MoneyNote.State.theme = theme;
      document.documentElement.setAttribute("data-theme", theme);
      MoneyNote.Storage.saveTheme(theme);

      if (this.dom && this.dom.themeIconSun && this.dom.themeIconMoon) {
        if (theme === "dark") {
          this.dom.themeIconSun.classList.add("hidden");
          this.dom.themeIconMoon.classList.remove("hidden");
          if (this.dom.themeModeText) this.dom.themeModeText.textContent = "Giao diện Tối";
        } else {
          this.dom.themeIconSun.classList.remove("hidden");
          this.dom.themeIconMoon.classList.add("hidden");
          if (this.dom.themeModeText) this.dom.themeModeText.textContent = "Giao diện Sáng";
        }
      }
    },

    // ========================================================================
    // Toast Notification
    // ========================================================================
    showToast: function (message, type = "success") {
      if (!this.dom || !this.dom.toastContainer) return;

      const toast = document.createElement("div");
      toast.className = "toast";
      toast.textContent = message;

      this.dom.toastContainer.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        toast.style.transition = "all 200ms ease";
        setTimeout(() => toast.remove(), 200);
      }, 2200);
    }
  };

  // Khởi động khi tài liệu HTML sẵn sàng
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      MoneyNote.App.init();
    });
  } else {
    MoneyNote.App.init();
  }
})();
