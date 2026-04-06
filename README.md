# DM Automation Framework

A comprehensive Playwright-based test automation framework for DemoApp testing using TypeScript. This framework implements Page Object Model (POM) design patterns with fixture composition, data-driven testing via Excel, and multi-layered utilities for API, database, and UI interactions.

---

## 📚 Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Initialization of the Project](#initialization-of-the-project)
4. [Use of Snippets](#use-of-snippets)
5. [Use of Environment Files (.env)](#use-of-environment-files-env)
6. [Use of Page Object Model (POM)](#use-of-page-object-model-pom)
7. [Use of Utilities](#use-of-utilities)
8. [Use of Fixtures](#use-of-fixtures)
9. [Test Data Management](#test-data-management)
10. [Global Setup and Teardown](#global-setup-and-teardown)
11. [Configuration Files](#configuration-files)
12. [Running Test Cases](#running-test-cases)
13. [Workflow Diagram](#workflow-diagram)
14. [Rules To Follow](#rules-to-follow)

---

## Introduction

DM Automation Framework is a production-grade test automation solution designed specifically for DemoApp applications. It provides:

- **Page Object Model (POM)** - Organized page classes for maintainability
- **Fixture Composition** - Layered fixtures for clean test code
- **Data-Driven Testing** - Excel-based test data with automatic JSON conversion
- **Multi-Layer Utilities** - Excel handling, SQL queries, API calls, DemoApp UI interactions
- **Parallel Execution** - Run 6 tests simultaneously for faster feedback
- **Comprehensive Reporting** - HTML and Allure reports with screenshots/videos
- **Auto-Login/Logout** - Tests automatically login before and logout after execution

**Tech Stack:** TypeScript, Playwright, Node.js 22+, DemoApp

---

## Prerequisites

Before setting up the project, ensure you have:

| Requirement         | Version       | Purpose                    |
| ------------------- | ------------- | -------------------------- |
| **Node.js**         | 24.13.0 (LTS) | JavaScript runtime         |
| **npm**             | 11+           | Package manager            |
| **Git**             | Latest        | Version control            |
| **VS Code**         | Latest        | Code editor (recommended)  |
| **DemoApp Account** | Active        | Access to test environment |

**Verify Installation:**

```powershell
node --version      # Should show v24.13.0 or higher
npm --version       # Should show 11.x or higher
git --version       # Should show git version
```

---

## Initialization of the Project

### Step 1: Clone the Repository

```powershell
git clone <repository-url>
cd DM_Automation
```

### Step 2: Install Dependencies

```powershell
npm install
```

This installs all required packages from `package.json` (Playwright, testing libraries, utilities, etc.)

### Step 3: Install Playwright Browsers

```powershell
npx playwright install
```

Downloads Chromium browser for testing.

### Step 4: Verify Setup

```powershell
# Run a sample test
npx playwright test tests/functional/navigation.spec.ts --headed

# View the report
npx playwright show-report
```

---

## Use of Snippets

Code snippets help teams write tests faster and consistently. Snippets are stored in `.vscode/snippets.json` (if configured in your project).

**Benefits:**

- Faster test creation
- Consistent code style
- Follows framework conventions

---

## Use of Environment Files (.env)

Environment files (`.env`) store configuration and credentials that differ between environments (UAT, Dev, Prod).

### File Structure

```
env/
├── .env.uat       # UAT environment config
├── .env.dev       # Dev environment config
├── .env.prod      # Production config (if needed)
└── .env.example   # Template (safe to commit)
```

### How It Works

1. **`playwright.config.ts` loads environment:**

    ```typescript
    const envName = process.env.ENVIRONMENT ?? 'uat'; // Default to 'uat'
    const environmentPath = path.resolve(__dirname, `./env/.env.${envName}`);
    dotenv.config({ path: environmentPath });
    ```

2. **Access in tests:**

    ```typescript
    process.env.BASE_URL; // Loaded from .env.uat
    process.env.MANAGER_USER_EMAIL; // Loaded from .env.uat
    ```

3. **Switch environments:**
    ```powershell
    ENVIRONMENT=dev npm test          # Run against dev
    ENVIRONMENT=uat npm test          # Run against uat (default)
    ```

### Never Commit Dynamic Files

Add to `.gitignore`:

```
.test-results
test-data/dm-auto-test-data.json
test-data/runtime-testdata.json
!test-data/dm-auto-test-data.xlsx
```

---

## Use of Page Object Model (POM)

Page Object Model encapsulates page elements and interactions in reusable classes.

### Directory Structure

```
pages/
├── base.Page.ts                    # Base class for all pages
└── demo-app/
    ├── common/
    │   ├── demoAppLogin.Page.ts       # Login page
    │   ├── demoAppNavigation.Page.ts  # Navigation menu
    │   └── menu.ts                 # Menu operations
    └── finance/
        └── accountsPayable/
            └── vendors/
                └── allVendors.Page.ts  # Vendor management page
```

### Benefits of POM

**Reusability** - Write once, use in multiple tests  
**Maintainability** - Change locator in one place  
**Scalability** - Easy to add new pages

---

## Use of Utilities

Utilities are helper functions for common operations. This framework includes:

### 1. Data Utilities (`utils/data-utils/`)

**Purpose:** Handle test data from Excel/JSON

### 2. Data Store Utilities (`utils/data-store-utils/`)

**Purpose:** Store and retrieve test-generated data (PO IDs, tokens, etc.)

**Files:**

- **`testDataStoreFactory.ts`** - Factory pattern to create storage instances
- **`jsonTestDataStore.ts`** - Save data to JSON file
- **`sqlTestDataStore.ts`** - Save data to SQL database
- **`ITestDataStore.ts`** - Interface for storage implementations

### 3. API Utilities (`utils/api-utils/`)

**Purpose:** Make HTTP requests to APIs with authentication

**Files:**

- **`authManager.ts`** - Manage OAuth tokens with auto-refresh
- **`apiTransport.ts`** - Handle HTTP requests/responses
- **`apiTypes.ts`** - TypeScript types for API requests/responses

### 4. DemoApp UI Utilities (`utils/demo-app-utils/`)

**Purpose:** Interact with DemoApp-specific UI elements

### Summary Table

| Utility              | Purpose                                     | Key Files                                         |
| -------------------- | ------------------------------------------- | ------------------------------------------------- |
| **Data Utils**       | Read Excel, convert to JSON, query data     | `excelData.ts`, `jsonData.ts`                     |
| **Data Store Utils** | Store test results (JSON/SQL)               | `testDataStoreFactory.ts`, `jsonTestDataStore.ts` |
| **API Utils**        | Make HTTP requests, manage auth tokens      | `apiCore.ts`, `authManager.ts`                    |
| **DemoApp UI Utils** | Interact with DemoApp grids, forms, dialogs | `demoAppUiHelpers.ts`                             |

---

## Use of Fixtures

Fixtures inject dependencies into tests. This framework uses fixture composition with multiple layers.

### Fixture Composition Architecture

```
┌─────────────────────────────────────┐
│  framework.fixture.ts               │ ← Import this in tests
│  (merges all below)                 │
├─────────────────────────────────────┤
│  api-fixture.ts                     │
│  • api, request                     │
├─────────────────────────────────────┤
│  runtime.data.fixture.ts            │
│  • runtimeData (save/read)          │
├─────────────────────────────────────┤
│  ui.auth.fixture.ts                 │
│  • beforeEach/afterEach hooks       │
├─────────────────────────────────────┤
│  test.data.fixture.ts               │
│  • testData (from Excel/JSON)       │
├─────────────────────────────────────┤
│  page.object.fixture.ts             │
│  • basePage, loginPage, etc.        │
├─────────────────────────────────────┤
│  @playwright/test (base)            │
│  • page, browser, expect            │
└─────────────────────────────────────┘
```

### 1. Page Object Fixture (`fixtures/ui/page.object.fixture.ts`)

**Purpose:** Inject page objects into tests

```typescript
export const test = base.extend<PageObjectFixtures>({
    uiHelpers: async ({ page }, use) => {
        await use(new DemoAppUiHelpers(page));
    },
    basePage: async ({ page, uiHelpers }, use) => {
        await use(new BasePage(page, uiHelpers));
    },
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
});
```

**Available in Tests:**

```typescript
test('Example', async ({ basePage, loginPage }) => {
    // Can use basePage and loginPage
});
```

### 2. Test Data Fixture (`fixtures/ui/test.data.fixture.ts`)

**Purpose:** Inject test data from Excel/JSON

### 3. UI Auth Fixture (`fixtures/ui/ui.auth.fixture.ts`)

**Purpose:** Auto-login before each test, logout after

### 4. Runtime Data Fixture (`fixtures/ui/runtime.data.fixture.ts`)

**Purpose:** Store and retrieve test-generated data

### 5. API Fixture (`fixtures/api/api-fixture.ts`)

**Purpose:** Inject API client

### Main Framework Fixture (`fixtures/common/framework.fixture.ts`)

**Always import from here in tests:**

```typescript
import { test, expect, request } from '@fixtures/common/framework.fixture';
// NOT: import { test } from '@playwright/test'

test('Your Test', async ({ basePage, testData, runtimeData, api }) => {
    // All fixtures available
});
```

---

## Test Data Management

### Excel as Master Data Source

**Location:** `test-data/dm-auto-test-data.xlsx`

**Structure:**

```
Sheet: Test_Cases

TestCaseID  | UserName | Password | Page | OrderAmount
------------|----------|----------|------|------------
1234        | user1    | pass1    | /    | 5000
1234        | user2    | pass2    | /    | 10000
1235        | user3    | pass3    | /    | 15000
```

### Data Flow

```
test-data/dm-auto-test-data.xlsx
              ↓
        (Global Setup)
              ↓
   global-setup.ts calls:
   generateExcelJsonIfNeeded()
              ↓
test-data/dm-auto-test-data.json (auto-generated)
              ↓
        (In Tests)
              ↓
   test.data.fixture.ts calls:
   getRowByTestCaseAndIndex(tc, rowIndex)
              ↓
          testData
              ↓
    Used in test: testData.UserName
```

### Using Test Data in Tests

**Single-Row Test:**

```typescript
test(
    'Login Test',
    {
        annotation: { type: 'TC', description: '1234' },
    },
    async ({ testData, loginPage }) => {
        // Automatically gets first row (rowIndex=0) for TC 1234
        await loginPage.userLogin(testData.UserName, testData.Password);
    }
);
```

**Multi-Row Data-Driven Test:**

```typescript
import { getRowsByTestCaseId } from '@utils/data-utils/jsonData';

const rows = getRowsByTestCaseId('1234');
rows.forEach((_, index) => {
    test(
        `Test Iteration ${index + 1}`,
        {
            annotation: [
                { type: 'TC', description: '1234' },
                { type: 'ROW', description: String(index) },
            ],
        },
        async ({ testData }) => {
            // Runs multiple times with different data
            console.log(`Running with: ${testData.UserName}`);
        }
    );
});
```

### Steps to Update Test Data

1. **Edit Excel:** Open `test-data/dm-auto-test-data.xlsx`
2. **Add/Modify rows:** Update TestCaseID, UserName, Password, etc.
3. **Delete JSON:** Delete `test-data/dm-auto-test-data.json`
4. **Run tests:** Next test run will auto-regenerate JSON from Excel

---

## Global Setup and Teardown

### Global Setup (`global-setup.ts`)

Runs **once** before all tests start.

**Configuration in `playwright.config.ts`:**

```typescript
export default defineConfig({
    globalSetup: './global-setup', // Runs before tests
    // ... other config
});
```

**Access RUN_ID in Tests:**

```typescript
test('Example', async () => {
    const runId = process.env.RUN_ID; // Available after setup
    console.log(`Test run: ${runId}`);
});
```

### Global Teardown (`global-teardown.ts`)

Runs **once** after all tests complete.

**Configuration in `playwright.config.ts`:**

```typescript
export default defineConfig({
    // globalTeardown: './global-teardown',  // Uncomment to enable
    // ... other config
});
```

**When to Use:**

- Clean up test records from DemoApp
- Close expensive resources
- Generate final reports
- Send notifications (email, Slack)

---

## Configuration Files

### 1. Prettier Configuration (`.prettierrc`)

Enforces code formatting consistency across the project.

**File:** `.prettierrc`

**Usage:**

```powershell
# Format all files
npx prettier --write .

# Check formatting (without changing)
npx prettier --check .
```

---

### 2. Package.json

Defines project metadata and dependencies.

**File:** `package.json`

**Common Commands:**

```powershell
npm install                 # Install all dependencies
npm test                    # Run all tests
npm run test:headed        # Run tests with visible browser
npm run test:debug         # Debug tests with inspector
npm run test:smoke         # Run only @smoke tagged tests
npm run report             # View HTML test report
```

---

### 3. TypeScript Configuration (`tsconfig.json`)

Configures TypeScript compiler and path aliases.

**File:** `tsconfig.json`

**Example: Using Path Aliases**

```typescript
// Instead of:
import { BasePage } from '../../../pages/base.Page';
import { test } from '../../../fixtures/common/framework.fixture';

// Write:
import { BasePage } from '@pages/base.Page';
import { test } from '@fixtures/common/framework.fixture';
```

---

### 4. Playwright Configuration (`playwright.config.ts`)

The main configuration that controls how tests are executed.

**File:** `playwright.config.ts`

---

## Running Test Cases

### Basic Test Execution

```powershell
# ========================================
# RUN ALL TESTS
# ========================================
npm test
# Runs all tests in ./tests folder
# Runs 6 tests in parallel
# Generates HTML and Allure reports


# ========================================
# RUN SPECIFIC TEST FILE
# ========================================
npx playwright test tests/functional/navigation.spec.ts
# Runs only tests in navigation.spec.ts file


# ========================================
# RUN TESTS BY TAG
# ========================================
npx playwright test --grep @smoke
# Runs only tests tagged with @smoke
# Tags are defined in test annotation: tag: ['@smoke']

npx playwright test --grep @regression
# Runs only regression tests

npx playwright test --grep "@smoke|@critical"
# Runs tests tagged with @smoke OR @critical (regex)


# ========================================
# RUN SINGLE TEST BY NAME
# ========================================
npx playwright test -g "Login and Navigate"
# Runs only test with title matching "Login and Navigate"


# ========================================
# CONTROL PARALLEL EXECUTION
# ========================================
npx playwright test --workers=1
# Run sequentially (1 test at a time) - slower but useful for debugging

npx playwright test --workers=2
# Run 2 tests in parallel


# ========================================
# DEBUG & INSPECT
# ========================================
npx playwright test --headed
# Show browser window while tests run

npx playwright test --debug
# Launch interactive debugger (can pause, step through code)

npx playwright test --headed --debug
# Debug with browser visible
```

### Environment Variables

```powershell
# ========================================
# RUN AGAINST DIFFERENT ENVIRONMENTS
# ========================================
ENVIRONMENT=uat npm test
# Loads env/.env.uat (default)

ENVIRONMENT=dev npm test
# Loads env/.env.dev

ENVIRONMENT=prod npm test
# Loads env/.env.prod (if needed)


# ========================================
# CI/CD ENVIRONMENT
# ========================================
CI=true npm test
# Runs with CI optimizations:
# - 4 workers (instead of 6)
# - 1 retry for flaky tests
# - forbidOnly: fails if test.only found
# - Good for GitHub Actions, Azure Pipelines, Jenkins
```

### Viewing Reports

```powershell
# ========================================
# HTML REPORT (Built-in Playwright Report)
# ========================================
# Automatically generated after tests
# Location: playwright-report/

# View in browser:
npx playwright show-report
# Opens interactive HTML report showing:
# - Test status (✓ Pass, ✗ Fail)
# - Test duration
# - Screenshots (on failure)
# - Video recordings (on failure)
# - Test steps


# ========================================
# ALLURE REPORT (Advanced Reporting)
# ========================================
# First, install Allure CLI (one-time):
npm install -g allure-commandline

# Generate and serve Allure report:
allure serve allure-results
# Opens interactive Allure report showing:
# - Test statistics (total, passed, failed, skipped)
# - Test history & trends
# - Duration analytics
# - Test categorization by tags
# - Filtering by tags/status


# ========================================
# MANUAL REPORT GENERATION
# ========================================
# If allure serve doesn't work, generate manually:
allure generate allure-results --clean -o allure-report
allure open allure-report
```

### Complete Test Workflow Example

```powershell
# 1. Install everything
npm install
npx playwright install

# 2. Configure credentials
# Edit env/.env.uat with DemoApp credentials

# 3. Run all tests
npm test

# 4. View HTML report
npx playwright show-report

# 5. Check for detailed analysis, install Allure
npm install -g allure-commandline

# 6. View Allure report
allure serve allure-results

# 7. Run specific tests (e.g., smoke tests only)
npx playwright test --grep @smoke

# 8. Debug a failing test
npx playwright test tests/functional/login.spec.ts --headed --debug
```

---

## Workflow Diagram

### What Happens When You Run `npm test`

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER RUNS: npm test (or npx playwright test)                        │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1️⃣  PLAYWRIGHT CONFIG LOADS (playwright.config.ts)                  │
│     • Determines ENVIRONMENT (default: 'uat')                       │
│     • Loads: env/.env.uat (credentials, BASE_URL)                   │
│     • Sets: workers=6, timeout=180s, reporters                      │
│     • Finds: testDir='./tests'                                      │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2️⃣  GLOBAL SETUP RUNS ONCE (global-setup.ts)                        │
│     • Generates unique RUN_ID (timestamp)                           │
│     • Loads Excel: test-data/dm-auto-test-data.xlsx                 │
│     • Converts to JSON: test-data/dm-auto-test-data.json            │
│     • Calls: generateExcelJsonIfNeeded()                            │
│     • Stores: process.env.RUN_ID                                    │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3️⃣  TEST DISCOVERY                                                  │
│     • Scans ./tests folder for *.spec.ts files                      │
│     • Finds all test cases                                          │
│     • Reads annotations: { type: 'TC', description: '1234' }        │
│     • Reads tags: ['@smoke', '@regression']                         │
│     • Prepares parallel execution (6 workers)                       │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4️⃣  FIXTURE COMPOSITION (for each test)                             │
│     imports from: fixtures/common/framework.fixture.ts              │
│                                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ a) Page Object Fixture                                  │     │
│     │    • Creates: BasePage, LoginPage, AllVendorsPage       │     │
│     │    • Injects: uiHelpers, demoAppNavigation                 │     │
│     │    From: page.object.fixture.ts                         │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ b) Test Data Fixture                                    │     │
│     │    • Reads: test annotation { type: 'TC', desc: '1234'} │     │
│     │    • Calls: getRowByTestCaseAndIndex('1234', 0)         │     │
│     │    • Queries: test-data/dm-auto-test-data.json          │     │
│     │    • Injects: testData fixture with Excel row           │     │
│     │    From: test.data.fixture.ts                           │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ c) UI Auth Fixture (beforeEach hook)                    │     │
│     │    • Calls: basePage.visitDemoApp(testData.Page)           │     │
│     │    • Calls: loginPage.userLogin(email, password)        │     │
│     │    • Auto-login before each test                        │     │
│     │    From: ui.auth.fixture.ts                             │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ d) Runtime Data Fixture                                 │     │
│     │    • Creates: runtimeData.save() method                 │     │
│     │    • Prepares storage for test-generated data           │     │
│     │    From: runtime.data.fixture.ts                        │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ e) API Fixture                                          │     │
│     │    • Creates: api client, request context               │     │
│     │    • Available for API testing                          │     │
│     │    From: api-fixture.ts                                 │     │
│     └─────────────────────────────────────────────────────────┘     │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5️⃣  PARALLEL TEST EXECUTION (6 workers running simultaneously)      │
│                                                                     │
│     test('Login and Navigate', {                                    │
│       annotation: { type: 'TC', description: '1234' },              │
│       tag: ['@smoke']                                               │
│     }, async ({ basePage, loginPage, testData, expect }) => {       │
│                                                                     │
│       // Auto-login already happened in beforeEach                  │
│                                                                     │
│       // Test actions                                               │
│       await basePage.visitDemoApp('/');                                │
│       await loginPage.userLogin(testData.UserName,                  │
│                                  testData.Password);                │
│       expect(true).toBe(true);                                      │
│                                                                     │
│       // If test calls:                                             │
│       await runtimeData.save({                                      │
│         orderId: 'ORD-12345',                                       │
│         status: 'CREATED'                                           │
│       });                                                           │
│       // Stored in: test-data/runtime-testdata.json                 │
│       // Key: {RUN_ID}_1234_0                                       │
│     });                                                             │
│                                                                     │
│     Key Classes Used:                                               │
│     • BasePage (pages/base.Page.ts)                                 │
│       - visitDemoApp(), reload(), waitForPageReady()                   │
│     • LoginPage (pages/demo-app/common/demoAppLogin.Page.ts)               │
│       - userLogin()                                                 │
│     • DemoAppUiHelpers (utils/demo-app-utils/demoAppUiHelpers.ts)             │
│       - Grid interactions, form filling                             │
│     • DemoAppNavigation (pages/demo-app/common/demoAppNavigation.Page.ts)     │
│       - Menu navigation                                             │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6️⃣  TEST RESULT CAPTURE (for each completed test)                   │
│                                                                     │
│     Playwright automatically captures:                              │
│     • Screenshots (if test fails)                                   │
│     • Video recording (if test fails)                               │
│     • Execution trace (for debugging)                               │
│     • Test metadata (duration, status, error messages)              │
│                                                                     │
│     Result written to:                                              │
│     • test-results/ folder (JSON format)                            │
│     • allure-results/ folder (for Allure report)                    │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7️⃣  GLOBAL TEARDOWN (Optional - if configured)                      │
│     Runs ONCE after all tests complete                              │
│                                                                     │
│     • Cleanup test data from DemoApp                                   │
│     • Close database connections                                    │
│     • Archive logs and reports                                      │
│     • Send email notifications                                      │
│     From: global-teardown.ts (if enabled)                           │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 8️⃣  REPORTERS GENERATE REPORTS                                     |
│                                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ HTML REPORT (playwright-report/)                        │     │
│     │ Generated by: reporter: [['html']]                      │     │
│     │ View with: npx playwright show-report                   │     │
│     │ Shows: Pass/fail, duration, screenshots, videos         │     │
│     │ Interactive: Filter by status, search tests             │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ ALLURE REPORT (allure-results/)                         │     │
│     │ Generated by: reporter: [['allure-playwright']]         │     │
│     │ View with: allure serve allure-results                  │     │
│     │ Shows: Statistics, trends, history, tag filtering       │     │
│     │ Interactive: Filter by tags, view test history          │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ TEST RESULTS (test-results/)                            │     │
│     │ Machine-readable JSON format                            │     │
│     │ Used for CI/CD integration                              │     │
│     └─────────────────────────────────────────────────────────┘     │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
                    ✅ DONE
         (View report: npx playwright show-report)
         (Or: allure serve allure-results)
```

### Summary Table: Execution Flow

| Step | Component | File                        | Purpose                               |
| ---- | --------- | --------------------------- | ------------------------------------- |
| 1    | Config    | `playwright.config.ts`      | Load environment, set test parameters |
| 2    | Setup     | `global-setup.ts`           | Generate RUN_ID, convert Excel→JSON   |
| 3    | Discovery | Playwright                  | Find all \*.spec.ts test files        |
| 4a   | Fixtures  | `page.object.fixture.ts`    | Create page objects                   |
| 4b   | Fixtures  | `test.data.fixture.ts`      | Inject test data from JSON            |
| 4c   | Fixtures  | `ui.auth.fixture.ts`        | Auto-login via beforeEach             |
| 4d   | Fixtures  | `runtime.data.fixture.ts`   | Prepare result storage                |
| 4e   | Fixtures  | `api-fixture.ts`            | Create API client                     |
| 5    | Execution | Test file (\*.spec.ts)      | Run test with all fixtures            |
| 6    | Capture   | Playwright                  | Screenshots, videos, traces           |
| 7    | Teardown  | `global-teardown.ts`        | Cleanup (optional)                    |
| 8    | Reports   | `allure-playwright`, `html` | Generate HTML and Allure reports      |

---

## Rules To Follow

1. Folder Naming - Use kebab-case (lowercase + hyphen)

```
pages/demo-app/finance/accounts-receivable/
utils/data-utils/
fixtures/runtime-data/
```

2. File Naming - Use kebab-case and end with .page.ts

```
customers.page.ts
vendor-invoice.page.ts
demo-app-login.page.ts
```

3. Fixture files - Use kebab-case and end with .fixture.ts

```
test-data.fixture.ts
page-object.fixture.ts
runtime-data.fixture.ts
```

4. Utility files - Use kebab-case and end with .utils.ts

```
pdf.utils.ts
date.utils.ts
excel-data.utils.ts
```

5. Class Naming - Use PascalCase

```
export class CustomersPage {}
export class PdfUtils {}
export class DemoAppLoginPage {}
```

6. Class File vs Class Name Rule
    1. File name must match class name meaning.

```
customers.page.ts → CustomersPage

pdf.utils.ts → PdfUtils
```

7. Method Naming - Use camelCase

```
async createCustomer() {}
async clickSave() {}
async waitForPageReady() {}
```

8.Interface Naming - Use PascalCase (Do NOT prefix with I)

```
export interface InvoiceFields {}
export interface CustomerDetails {}
```

9. Locator Naming - Use camelCase and meaningful names

```
readonly saveButton = this.page.getByRole('button', { name: 'Save' });
readonly customerNameInput = this.page.locator('input[name="Name"]');

```

10. Method Documentation Rule
    Every method must have:
    1. 1 line summary
    2. @param for each param
    3. @returns

Example:

```
/**
 * Downloads the PDF and returns extracted text.
 * @param page Playwright page instance
 * @param clickDownload Function that clicks the download button
 * @returns Extracted PDF text
 */
static async downloadPdfAndRead(...) {}

```

11. Branching Strategy -> Use the UserStory Number + Test Case/ Tests workflow

```
 feature/1234_LoginFlowForDemoApp
 dev/1234_LobsterFlowForSCM
 bug/2121(bugnumber)_TestCaseUpdate

```

## Summary

This DM Automation Framework provides:

**Structured Architecture** - POM, fixtures, utilities organized by concern

**Data-Driven Testing** - Excel-based test data with automatic JSON conversion

**Parallel Execution** - 6 concurrent workers for faster feedback

**Comprehensive Reporting** - HTML and Allure reports with screenshots/videos

**Auto-Login/Logout** - Tests automatically handle authentication

**Reusable Components** - Pages, utilities, and fixtures for rapid test development

**Team-Friendly** - Clear comments, path aliases, and configuration documentation

**Quick Links:**

- Documentation: See individual sections above
- Run tests: `npm test`
- View reports: `npx playwright show-report`
- Debug: `npx playwright test --headed --debug`

---

**Last Updated:** February 19, 2026
**Framework Version:** 1.0.0
**Playwright Version:** 1.57.0+

```

```
