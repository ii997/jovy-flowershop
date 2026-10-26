# 07: Cross-event reliability and authorization verification

**What to build:** The complete notification system is verified across every event so notifications dispatch after commit, suppress duplicate requests, retry three times, preserve genuine payment resubmissions, never block order/payment workflows, and protect staff operations data.

**Blocked by:** 02: Fulfillment progress notifications; 03: Order cancellation notifications; 04: Payment receipt submission notifications; 05: Payment outcome notifications; 06: Delivery failure operations view

**Status:** ready-for-agent

- [ ] End-to-end tests cover every customer event in the notification matrix through authenticated order/payment transitions.
- [ ] All email and SMS jobs dispatch after successful commit and are absent after rollback.
- [ ] All channels enforce three attempts with increasing backoff and retain permanent failure records.
- [ ] Duplicate requests are suppressed while genuine payment resubmissions remain distinct events.
- [ ] Resend and SMS gateway outages do not fail the underlying order or payment action.
- [ ] Recipient routing is consistently limited to account email and order recipient phone.
- [ ] Admin/staff delivery-failure access and customer denial are verified across all relevant endpoints.
- [ ] The full existing test suite and frontend build remain green.
