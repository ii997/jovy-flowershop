# Transactional Email and SMS Notifications

Status: ready-for-agent

## Problem Statement

Customers currently receive some order and payment updates through in-app notifications and SMS, but there is no consistent customer-facing email channel. Delivery behavior is also not defined uniformly across channels: repeated requests can risk duplicate notifications, failures need reliable retry handling, and staff need visibility when delivery permanently fails.

Customers need dependable transactional communication about their Online Order and payment lifecycle without notification delivery blocking the underlying order workflow.

## Solution

Add customer-only transactional email notifications alongside the existing SMS notifications for meaningful order and payment events.

Email will use Resend through Laravel's mail abstraction. Both email and SMS will be queued after the related database transaction commits. Each channel will retry failed delivery three times with backoff, retain delivery history, and never prevent an order or payment action from succeeding.

Duplicate requests will not create duplicate notifications. A genuine payment resubmission is a new meaningful transaction and will notify the customer again.

## User Stories

1. As a customer, I want to receive an email when my Online Order is confirmed, so that I know the shop accepted my order submission.
2. As a customer, I want to receive an SMS when my Online Order is confirmed, so that I receive an update even when I am not checking the website.
3. As a customer, I want to receive an email when my arrangement is being prepared, so that I know fulfillment has started.
4. As a customer, I want to receive an SMS when my arrangement is being prepared, so that I can track progress quickly.
5. As a customer, I want to receive an email when my order is ready for pickup or completed, so that I know when action is required from me.
6. As a customer, I want to receive an SMS when my order is ready for pickup or completed, so that the pickup update reaches me promptly.
7. As a customer, I want to receive an email when my order is cancelled, so that I understand the final order outcome.
8. As a customer, I want to receive an SMS when my order is cancelled, so that I do not travel to collect a cancelled order.
9. As a customer, I want to receive an email when my payment receipt is uploaded and awaiting review, so that I know the shop received my proof of payment.
10. As a customer, I want to receive an SMS when my payment receipt is uploaded and awaiting review, so that I have immediate confirmation of receipt submission.
11. As a customer, I want to receive an email when my payment is verified, so that I know the payment requirement has been satisfied.
12. As a customer, I want to receive an SMS when my payment is verified, so that I can rely on a fast confirmation.
13. As a customer, I want to receive an email when my payment proof is rejected, so that I know I must submit replacement proof.
14. As a customer, I want to receive an SMS when my payment proof is rejected, so that I can correct the payment issue without waiting to log in.
15. As a customer, I want to receive an email when my payment is underpaid, so that I know the remaining balance required to proceed.
16. As a customer, I want to receive an SMS when my payment is underpaid, so that I can address the shortfall promptly.
17. As a customer, I want to receive an email when my payment is overpaid, so that I know the shop detected the excess amount and what happens next.
18. As a customer, I want to receive an SMS when my payment is overpaid, so that I receive the outcome through a short, accessible channel.
19. As a customer, I want notifications sent to the valid email address on my authenticated account, so that private order information is not sent to an arbitrary address.
20. As a customer, I want SMS notifications sent to the phone number on my order, so that the recipient contact selected for fulfillment receives the message.
21. As a customer, I want transactional notifications to remain enabled, so that important order and payment information cannot be accidentally disabled.
22. As a customer, I want an email to include a plain-text alternative, so that I can read it in clients that do not render HTML.
23. As a customer, I want notification emails to identify my order and the relevant next action, so that I can understand what to do without opening the website.
24. As a customer, I want notification messages to avoid exposing payment credentials or provider secrets, so that communication remains safe to forward or store.
25. As a customer, I want repeated submissions of the same order or status request not to send duplicate messages, so that my inbox and phone are not spammed.
26. As a customer, I want each genuine payment resubmission after rejection to generate a new notification, so that I know the replacement proof was received.
27. As a customer, I want order actions to succeed even if Resend or an SMS gateway is temporarily unavailable, so that communication outages do not prevent ordering.
28. As an admin or staff member, I want to see permanently failed email and SMS delivery records, so that I can investigate communication problems.
29. As an admin or staff member, I want delivery records associated with an order and notification event, so that support can trace what the customer should have received.
30. As an admin or staff member, I want retry attempts and failure details recorded, so that I can distinguish a transient failure from a permanently failed delivery.
31. As an admin or staff member, I want provider credentials and sensitive provider payloads hidden from delivery history, so that operational visibility does not create a secrets exposure.
32. As an operator, I want local and test environments to use safe mail and SMS modes, so that feature tests do not send real customer messages.
33. As an operator, I want Resend configuration to be supplied through environment-backed mail settings, so that credentials are not committed to the repository.
34. As an operator, I want notification jobs dispatched only after a successful order or payment commit, so that customers are not told about state changes that were rolled back.
35. As an operator, I want failed notifications retried three times with increasing delays, so that temporary provider outages recover without indefinite retries.
36. As an operator, I want permanently failed notifications retained after retries are exhausted, so that no failure disappears silently.

## Implementation Decisions

- Extend the existing notification domain so customer transactional events can dispatch both an email job and the existing SMS job.
- Customer recipients are restricted to the authenticated customer's account email and the order's recipient phone. Staff/admins are not recipients of this feature; they only receive operational visibility into permanent delivery failures.
- The customer event matrix includes:
  - Order confirmed.
  - Order preparing.
  - Ready for pickup / delivered or completed.
  - Order cancelled.
  - Payment receipt uploaded and awaiting review.
  - Payment verified.
  - Payment rejected.
  - Payment underpaid.
  - Payment overpaid.
- Existing staff/admin alert events such as new-order alerts and payment-review alerts are not converted into customer notifications unless they also represent one of the customer events above.
- Email uses the Resend transport through Laravel's mail abstraction. Credentials and provider configuration come from environment-backed configuration. The sender name and sender address use the configured mail identity.
- Email messages are responsive HTML with a plain-text fallback. Each message includes the shop identity, order reference, relevant event summary, required next action where applicable, and a support/store contact path.
- SMS continues to use the existing gateway abstraction and fallback chain. Customer SMS content uses the existing SMS template vocabulary and stays concise enough for SMS delivery.
- Both channels are asynchronous and non-blocking. Jobs are dispatched after the related database transaction commits, never before.
- Each channel uses three maximum delivery attempts with exponential/increasing backoff. The existing SMS retry pattern is retained; email follows the same operational policy.
- A failed provider request is retried when the job can reasonably treat it as transient. After the third failed attempt, the job is marked permanently failed and a delivery record is retained.
- A notification event is idempotent. Repeated HTTP requests, page refreshes, duplicate status submissions, and duplicate callbacks do not create additional notifications for the same meaningful transaction.
- A genuine payment resubmission creates a new meaningful transaction and therefore creates a new customer email and SMS notification, even when it belongs to the same order.
- Notification identity must distinguish at least the order, channel, event, and meaningful transaction. Payment resubmissions must have a distinct transaction identity from the rejected submission.
- Email delivery history is persisted with the order, customer recipient, event, channel, attempt count, status, timestamps, and safe failure details. Existing SMS history is retained and aligned with the same event identity where practical.
- Delivery records expose only operationally safe information. API keys, authorization headers, full provider payloads, and other secrets are never stored or shown.
- Admin/staff access to permanent delivery failures is added to the existing protected administrative area. Customer-facing notification APIs remain authenticated and customer-scoped.
- Transactional notifications cannot be disabled by customers. Marketing or promotional messaging preferences are outside this feature.
- Valid account email is sufficient for delivery; email verification is not introduced as a prerequisite by this feature.
- Missing recipient contact data is handled as a delivery failure/skip that is recorded safely and does not block the order or payment action.

## Testing Decisions

- Tests assert externally observable behavior at the highest existing seam: authenticated HTTP feature requests that create or transition orders and submit or review payments.
- Queue fakes verify that the correct customer notification jobs are dispatched after successful state changes and are not dispatched when the database transaction rolls back.
- Mail fakes verify the recipient, event, subject/content essentials, and plain-text fallback without making a network request to Resend.
- SMS fakes or the existing SMS test/log mode verify the recipient, event, retry behavior, fallback behavior, and persisted SMS delivery record without contacting a real gateway.
- Feature tests cover every event in the customer event matrix, including both email and SMS dispatch.
- Feature tests verify that customer notifications use the authenticated account email and order recipient phone, and do not use arbitrary submitted contact values.
- Feature tests verify duplicate request suppression and verify that a genuine payment resubmission creates a new notification event.
- Feature tests verify three attempts, increasing backoff, permanent failure recording, and non-blocking order/payment success.
- Feature tests verify after-commit behavior by forcing a transaction rollback and asserting that no customer notification is delivered.
- Feature tests verify that missing or invalid contact data does not fail the order/payment action and produces safe operational history.
- Authorization tests verify that only admins/staff can inspect permanent delivery failures and that customers cannot access another customer's delivery records.
- Configuration tests verify Resend selection through environment-backed Laravel mail configuration and safe log/array behavior in test environments.
- Prior art includes the existing order/payment feature tests, `SendStatusUpdateSMS` queue tests, `SmsLog` assertions, authenticated API tests, and admin authorization tests. New tests should follow those patterns rather than testing provider SDK internals.

## Out of Scope

- Marketing, promotional, newsletter, or abandoned-cart messaging.
- Customer-configurable notification preferences or opt-out controls for transactional notices.
- Implementing account email verification.
- Replacing the existing SMS gateway abstraction or removing its fallback providers.
- Sending customer notifications to staff/admin email addresses or phone numbers.
- Sending notifications for every API request, page refresh, polling request, or duplicate callback.
- Changing the Order Lifecycle or payment verification rules.
- Exposing Resend's raw dashboard, provider payloads, API keys, or authorization data in the application.
- Building a general-purpose notification campaign editor.
- Guaranteeing delivery when the customer has supplied no usable email address or phone number.

## Further Notes

- The existing domain glossary defines a Transactional Notification, Notification Recipient, Notification Delivery, Notification Event, Delivery Record, and Meaningful Transaction. Implementation and tests should use those terms consistently.
- The highest-value implementation seam is the authenticated order/payment transition boundary, with queue and mail fakes layered underneath it. Provider-specific integration tests are not required for the first implementation.
- Resend credentials and sender-domain configuration must be supplied by deployment configuration; no credentials belong in source control.
