# 04: Payment receipt submission notifications

**What to build:** Customers receive email and SMS when a payment receipt is submitted and enters review. A genuine payment resubmission creates a new notification event, while duplicate requests do not.

**Blocked by:** 01: Transactional notification foundation and order confirmation

**Status:** ready-for-agent

- [ ] A successful payment receipt submission sends one customer email and one customer SMS for the awaiting-review event.
- [ ] The notification is dispatched only after the payment submission and transaction record commit successfully.
- [ ] Repeating the same submission request does not create duplicate notification events.
- [ ] A genuine payment resubmission after rejection creates a new meaningful transaction and sends new email and SMS notifications.
- [ ] Notifications use the authenticated customer's account email and the order recipient phone.
- [ ] Feature tests cover first submission, duplicate submission, resubmission, rollback, recipients, and safe content.
