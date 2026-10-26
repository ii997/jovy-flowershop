# 01: Transactional notification foundation and order confirmation

**What to build:** After an Online Order is confirmed, the customer receives both an email through Resend and an SMS. Delivery is queued after the order commit, retried up to three times, deduplicated, and recorded for staff/admin inspection when permanently failed.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A confirmed Online Order dispatches one customer email and one customer SMS after the database transaction commits.
- [ ] Email uses Resend through Laravel mail configuration, with configured sender identity, responsive HTML, and a plain-text fallback.
- [ ] Email uses the authenticated customer's account email; SMS uses the order recipient phone.
- [ ] Repeated requests for the same meaningful transaction do not dispatch duplicate notifications.
- [ ] Each channel retries failed delivery three times with increasing backoff and does not block the order action.
- [ ] Permanent delivery failures are persisted with order, channel, event, recipient, attempts, timestamps, and safe failure details.
- [ ] Provider credentials and sensitive provider payloads are not persisted or exposed.
- [ ] Local/test delivery uses safe fakes or log/array modes and never contacts Resend or a real SMS gateway.
- [ ] Authenticated feature tests cover successful dispatch, after-commit behavior, duplicate suppression, retry handling, and permanent failure recording.
