# 1. Streamlined Order Lifecycle Without Preparation State

## Context

The system previously included an intermediate `preparing` order status between `confirmed` and `ready_for_pickup` / `delivered`. In actual store operations, fresh bouquets are assembled immediately upon scheduled pickup or customer arrival, making an explicit digital "Start Preparing" stage redundant.

## Decision

We streamline the order lifecycle to move directly from `Confirmed` (payment verified) to `Ready for Pickup` (or `Delivered`). The manual "Start Preparing" button and the `preparing` filter tab are removed from the administrative UI. SMS notifications are adjusted to trigger upon confirmation and when flowers are marked ready for pickup.

## Consequences

- Staff experience is simplified with fewer state transition steps per order.
- Customer communication remains clear via automatic SMS alerts on confirmation and pickup readiness.
- Past orders with historic `preparing` status remain valid and queryable.
