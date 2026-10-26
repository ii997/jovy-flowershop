# 02: Fulfillment progress notifications

**What to build:** Customers receive email and SMS notifications when their arrangement is being prepared and when their order is ready for pickup / completed.

**Blocked by:** 01: Transactional notification foundation and order confirmation

**Status:** ready-for-agent

- [ ] The preparing event sends one customer email and one customer SMS.
- [ ] The ready-for-pickup / completed event sends one customer email and one customer SMS.
- [ ] Messages identify the order and explain the relevant next action.
- [ ] Repeated status requests do not create duplicate notifications for the same meaningful transaction.
- [ ] Delivery uses the account email and order recipient phone defined by the notification domain.
- [ ] Feature tests verify event dispatch, recipients, content essentials, and duplicate suppression.
