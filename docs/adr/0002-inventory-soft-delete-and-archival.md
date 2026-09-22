# 2. Inventory Soft Deletion and Archival

## Context

Administrators need the ability to delete discontinued arrangements and loose flower items from the active inventory catalog. However, existing order records and historic sales analytics reference product and flower IDs. Hard-deleting catalog records would either violate database referential integrity or distort historical transaction breakdowns.

## Decision

We use soft deletion (`SoftDeletes` / `deleted_at`) for both floral products and flower stems. When an item is deleted in the admin inventory panel, it is hidden from the active catalog and customer checkout, but remains stored in the database. An admin filter toggle (`Show Archived`) and a restore action allow administrators to view and un-archive items if necessary.

## Consequences

- Historical orders, invoices, and analytics retain accurate product names, pricing, and associations.
- Accidental catalog deletions can be recovered without database backups.
- Public customer catalog queries must filter out soft-deleted records.
