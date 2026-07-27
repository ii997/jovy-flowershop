# TDD Evidence Report: Rename `dimensions` → `size`

**Date**: 2026-07-27
**Source**: User request to rename `dimensions` to `size` across the full stack
**Related Plan**: No `*.plan.md` — journeys derived during TDD run

---

## 1. User Journeys

| ID | Journey |
|----|---------|
| UJ1 | As an **admin**, I want to create a product with a `size` field instead of `dimensions`, so that the data model matches the UI terminology |
| UJ2 | As an **admin**, I want the product catalog to display `Size` column instead of `Dimensions`, so that the inventory table uses consistent terminology |
| UJ3 | As a **customer**, I want to see `Size` on product cards instead of `Dimensions`, so that the storefront matches the admin terminology |
| UJ4 | As a **developer**, I want the database column renamed from `dimensions` to `size`, so that the schema reflects the application terminology |

## 2. Task Report

### Task 1: Rename `dimensions` column to `size` in the database

**Execution**: Created migration `2026_07_27_080522_rename_dimensions_to_size_in_products_table.php` using `renameColumn()` with rollback support. Updated Product model `#[Fillable]` attribute. Updated `DatabaseSeeder.php` to use `'size'`.

**Validation**: `php artisan migrate` ran successfully. `php artisan migrate:rollback` reverts correctly.

**What is guaranteed**: The `products` table has a `size` column instead of `dimensions`. Existing data is preserved via `renameColumn()`.

### Task 2: Update Admin API controller

**Execution**: Changed `AdminController::storeProduct()` and `AdminController::updateProductDetails()` validation keys, assignment, and Product::create() from `'dimensions'` to `'size'`.

**Validation**: `POST /api/admin/products` with `'size'` field returns 200 and persists the value. `$product->size` returns the stored value.

**What is guaranteed**: API routes accept `size` as the field name and reject `dimensions`. Product CRUD operations use `size`.

### Task 3: Update TypeScript types and frontend components

**Execution**: Changed `Product` interface `dimensions: string` → `size: string`. Updated `InventoryTab.tsx`, `ProductCard.tsx`, `ProductCreateModal.tsx`, `ProductEditModal.tsx` to use `size`.

**Validation**: `npm run build` passes (TypeScript compilation, Vite bundle).

**What is guaranteed**: All React components reference `product.size` instead of `product.dimensions`. The admin inventory table displays "Size" column header. Product cards show "Size:" label. Create/edit modals send `size` in API payload.

## 3. Test Specification

| # | What is guaranteed | Test | Type | Result | Evidence |
|---|--------------------|------|------|--------|----------|
| 1 | Admin can create a product with `size` field and it persists correctly | `AdminTest::test_admin_can_create_product_with_size_field()` | Integration (Feature) | ✅ PASS | `php artisan test --filter AdminTest` |
| 2 | `size` field is properly stored and retrievable | `AdminTest::test_admin_can_create_product_with_size_field()` asserts `$product->size === '30cm x 20cm'` | Integration (Feature) | ✅ PASS | Same test above |
| 3 | Staff cannot create products (still uses `size` in payload) | `AdminTest::test_staff_cannot_access_admin_only_endpoints()` | Integration (Feature) | ✅ PASS | `php artisan test --filter AdminTest` |
| 4 | Full test suite remains green after rename | All 76 tests pass with 164 assertions | Full suite | ✅ PASS | `php artisan test --compact` |

## 4. RED / GREEN Evidence

```
RED phase (Step 3):
  Command: php artisan test --filter test_admin_can_create_product_with_size_field
  Expected: Test fails because AdminController still validates 'dimensions'
  Result:  [R] AdminController::storeProduct() validates 'dimensions', ignores 'size'
          → product.size is null → assertion fails → RED confirmed

GREEN phase (Step 5):
  Command: php artisan test --compact
  Result:  76 tests passed, 164 assertions
  Output:  {"tool":"phpunit","result":"passed","tests":76,"passed":76,"assertions":164}

BUILD verification:
  Command: npm run build
  Result:  ✓ built in 833ms (TypeScript compiles, Vite bundles)
  Output:  All chunks generated without errors
```

## 5. Coverage

Coverage was not measured (no coverage configuration in phpunit.xml for this project). The test is an integration test exercising the full POST → persist → retrieve → assert flow, which covers the critical path.

### Known gaps (intentional)
- No unit test for the migration `renameColumn()` call (Laravel built-in, well-tested upstream)
- No frontend component test for `product.size` rendering (project does not use a frontend test framework)
- No test for product update with `size` via `updateProductDetails()` route at `/api/admin/products/{id}/update`

## 6. Files Changed

### Database
| File | Change |
|------|--------|
| `database/migrations/2026_07_27_080522_rename_dimensions_to_size_in_products_table.php` | **NEW** — Renames `dimensions` → `size` with rollback |
| `database/seeders/DatabaseSeeder.php` | Seed data uses `'size'` instead of `'dimensions'` |

### Backend
| File | Change |
|------|--------|
| `app/Models/Product.php` | `#[Fillable]` uses `'size'` instead of `'dimensions'` |
| `app/Http/Controllers/AdminController.php` | Validation keys, assignments use `'size'` |

### Frontend (TypeScript)
| File | Change |
|------|--------|
| `resources/js/types.ts` | `Product` interface: `dimensions: string` → `size: string` |
| `resources/js/components/admin/InventoryTab.tsx` | Column accessor `'dimensions'` → `'size'`, header `'Dimensions'` → `'Size'` |
| `resources/js/components/ProductCard.tsx` | Display label `Dimensions:` → `Size:`, `product.dimensions` → `product.size` |
| `resources/js/components/ProductCreateModal.tsx` | API payload key `dimensions:` → `size:` |
| `resources/js/components/ProductEditModal.tsx` | State `setDimensions` → `setSize`, payload key `dimensions:` → `size:` |

### Tests
| File | Change |
|------|--------|
| `tests/Feature/AdminTest.php` | **NEW** `test_admin_can_create_product_with_size_field()` | Updated `test_staff_cannot_access_admin_only_endpoints` payload from `'dimensions'` → `'size'` |

## 7. Merge Evidence

Checkpoint commits:

```
RED:   test: add size field reproducer replacing dimensions
       - Added AdminTest::test_admin_can_create_product_with_size_field()
       - Created migration renaming dimensions → size
       - Updated Product model fillable and DatabaseSeeder

GREEN: fix: rename dimensions to size across full stack
       - Updated AdminController validation and CRUD
       - Updated TypeScript Product interface
       - Updated InventoryTab, ProductCard, ProductCreateModal, ProductEditModal
       - All 76 tests pass, frontend build passes
```
