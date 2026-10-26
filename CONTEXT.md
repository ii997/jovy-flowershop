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

### Notifications

**Transactional Notification**:
A customer-facing message about an order or payment state, including order confirmation, fulfillment updates, cancellation, receipt review, and payment verification outcomes. These notices are operational and cannot be opted out of.
_Avoid_: Marketing message, promotional notification

**Notification Recipient**:
For transactional notices, the authenticated customer's account email is the email destination and the order recipient phone is the SMS destination.
_Avoid_: Staff alert recipient, arbitrary contact

**Notification Delivery**:
An asynchronous, non-blocking delivery attempt that occurs after the related order or payment state is committed. Email and SMS failures are retried and logged without blocking the order workflow; SMS may fall back across configured gateways.
_Avoid_: Synchronous notification, delivery-gated order

**Notification Event**:
A meaningful change in an order or payment lifecycle that can notify the customer through both email and SMS, such as confirmation, fulfillment progress, cancellation, receipt review, or payment outcome.
_Avoid_: Every API request, arbitrary status poll

**Delivery Record**:
The persistent history of a channel's notification attempts, including its recipient, associated order, attempt count, outcome, and failure details, used for support and retry diagnosis.
_Avoid_: Ephemeral log line, notification preference

**Meaningful Transaction**:
A durable order or payment action that represents a real business event. Repeated requests that do not create a new action are not separately notified; a genuine payment resubmission is a new transaction and may notify the customer again.
_Avoid_: HTTP request, page refresh, duplicate callback
