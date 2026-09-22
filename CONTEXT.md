# Jovy's Flowershop Domain Glossary

Floral e-commerce and retail counter management system handling fresh flower arrangements, inventory stock tracking, and multi-channel order fulfillment.

## Language

### Ordering & Fulfillment

**Walk-in Order**:
An order created manually at the shop counter by staff for on-site customers, immediately verified without requiring payment proof uploads.
_Avoid_: Offline order, POS ticket, manual draft

**Online Order**:
An order placed by a customer through the web catalog and checkout portal.
_Avoid_: Web cart, remote order

**Order Lifecycle**:
The streamlined progression of states an order moves through: `Pending Payment` → `Confirmed` → `Ready for Pickup / Delivered` (or `Cancelled`).
_Avoid_: Preparing, processing, assembly state

**No Refund Policy**:
The store agreement stating that fresh, perishable floral arrangements and customized bouquets are final sale upon confirmation.
_Avoid_: Return clause, refund guarantee

### Floral Catalog & Inventory

**Arrangement**:
A curated bouquet or pre-assembled floral composition composed of stems, foliage, and specialized wrapping.
_Avoid_: Package, bundle, generic item

**Stem**:
A single loose flower unit or component species tracked in inventory counts and custom bouquet assembly.
_Avoid_: Raw flower, loose piece

**Archived Item**:
A floral arrangement or stem removed from the active catalog via soft deletion while retaining full historic audit and order records.
_Avoid_: Hard-deleted product, purged item

### Storefront Presentation & Discovery

**Seasonal-Based Display**:
An interactive storefront discovery component pairing a 3D rotating flower species carousel (`CircularGallery`) with a dynamic showcase of occasion-styled arrangements.
_Avoid_: Static photo gallery, hero slider

**Occasion Mapping**:
The classification of floral arrangements by intended life event or sentiment (e.g., Birthday, Wedding, Funeral, Anniversary, Valentine's), surfaced through visual occasion badge pills.
_Avoid_: Occasion filter tag, event category
