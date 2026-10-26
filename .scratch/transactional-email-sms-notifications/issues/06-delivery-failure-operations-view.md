# 06: Delivery failure operations view

**What to build:** Admins and staff can inspect permanently failed email and SMS delivery records, including order, channel, event, attempt count, timestamps, and safe failure details.

**Blocked by:** 01: Transactional notification foundation and order confirmation

**Status:** ready-for-agent

- [ ] The protected administrative area exposes permanently failed email and SMS delivery records.
- [ ] Records can be associated with an order and notification event.
- [ ] Staff/admin users can see channel, recipient identifier, attempt count, timestamps, status, and safe failure details.
- [ ] Provider credentials, authorization headers, and full sensitive provider payloads are never shown.
- [ ] Customers cannot access another customer's delivery records or the staff operations view.
- [ ] Feature tests verify staff/admin authorization, customer denial, response shape, and sensitive-data redaction.
