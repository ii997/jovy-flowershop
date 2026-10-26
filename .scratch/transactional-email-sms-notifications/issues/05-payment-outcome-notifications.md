# 05: Payment outcome notifications

**What to build:** Customers receive email and SMS for payment verification, rejection, underpayment, and overpayment outcomes, including the correct next action.

**Blocked by:** 04: Payment receipt submission notifications

**Status:** ready-for-agent

- [ ] Payment verification sends one customer email and one customer SMS.
- [ ] Payment rejection sends one customer email and one customer SMS instructing the customer to submit replacement proof when applicable.
- [ ] Underpayment sends one customer email and one customer SMS explaining that a remaining balance is required.
- [ ] Overpayment sends one customer email and one customer SMS explaining the recorded outcome and next action.
- [ ] Repeated payment-status requests do not create duplicate notifications for one meaningful decision.
- [ ] Feature tests verify event mapping, recipients, content essentials, after-commit behavior, and duplicate suppression.
