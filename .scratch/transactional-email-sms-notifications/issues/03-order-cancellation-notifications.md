# 03: Order cancellation notifications

**What to build:** Customers receive email and SMS when their order is cancelled, with safe customer-facing information about the final outcome and any relevant next action.

**Blocked by:** 01: Transactional notification foundation and order confirmation

**Status:** ready-for-agent

- [ ] A meaningful order cancellation sends one customer email and one customer SMS.
- [ ] Cancellation messages do not expose internal notes, credentials, or unsafe provider data.
- [ ] Repeated cancellation requests do not create duplicate notifications.
- [ ] Delivery uses the authenticated customer's account email and the order recipient phone.
- [ ] Feature tests verify successful dispatch, safe content, authorization, and duplicate suppression.
