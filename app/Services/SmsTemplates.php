<?php

namespace App\Services;

class SmsTemplates
{
    /**
     * Standardized sender header prefix.
     */
    public static function header(): string
    {
        $sender = config('sms.sender_name', "Jovy's Flowershop");

        return "{$sender}:";
    }

    /**
     * Automated non-reply suffix for customer notifications.
     */
    public static function customerSuffix(): string
    {
        return ' (Do not reply)';
    }

    /**
     * Order confirmed / submitted notice to customer.
     */
    public static function orderConfirmed(int $orderId): string
    {
        $header = self::header();
        $suffix = self::customerSuffix();

        return "{$header} Order #JFS-{$orderId} has been confirmed. Thank you!{$suffix}";
    }

    /**
     * Order preparing for pickup / dispatch notice to customer.
     */
    public static function orderPreparing(int $orderId): string
    {
        $header = self::header();
        $suffix = self::customerSuffix();

        return "{$header} Order #JFS-{$orderId} is now being prepared for pickup!{$suffix}";
    }

    /**
     * Order delivered / completed notice to customer.
     */
    public static function orderDelivered(int $orderId): string
    {
        $header = self::header();
        $suffix = self::customerSuffix();

        return "{$header} Order #JFS-{$orderId} is ready for pickup / completed. Thank you!{$suffix}";
    }

    public static function orderReadyForPickup(int $orderId): string
    {
        $header = self::header();
        $suffix = self::customerSuffix();

        return "{$header} Order #JFS-{$orderId} is ready for pickup at the store.{$suffix}";
    }

    /**
     * Order cancelled by shop notice to customer.
     */
    public static function orderCancelled(int $orderId, ?string $reason = null): string
    {
        $header = self::header();
        $suffix = self::customerSuffix();
        $cleanedReason = $reason ? ' Reason: '.self::sanitize($reason, 25).'.' : '';

        return "{$header} Order #JFS-{$orderId} has been cancelled by the shop.{$cleanedReason}{$suffix}";
    }

    /**
     * Payment verified notice to customer.
     */
    public static function paymentVerified(int $orderId, ?float $amount = null): string
    {
        $header = self::header();
        $suffix = self::customerSuffix();
        $amountText = $amount !== null ? ' (₱'.number_format($amount, 2).')' : '';

        return "{$header} Payment for Order #JFS-{$orderId}{$amountText} has been verified.{$suffix}";
    }

    /**
     * Payment rejected notice to customer.
     */
    public static function paymentRejected(int $orderId, ?string $reason = null): string
    {
        $header = self::header();
        $suffix = self::customerSuffix();
        $cleanedReason = $reason ? ' Reason: '.self::sanitize($reason, 15).'.' : '';

        return "{$header} Payment proof for Order #JFS-{$orderId} could not be verified.{$cleanedReason} Please re-submit proof.{$suffix}";
    }

    /**
     * Payment underpaid alert to customer.
     */
    public static function paymentUnderpaid(int $orderId, ?string $reason = null): string
    {
        $header = self::header();
        $suffix = self::customerSuffix();
        $cleanedReason = $reason ? ' '.self::sanitize($reason, 20).'.' : '';

        return "{$header} Payment for Order #JFS-{$orderId} is underpaid.{$cleanedReason} Please pay remaining balance.{$suffix}";
    }

    /**
     * Payment overpaid alert to customer.
     */
    public static function paymentOverpaid(int $orderId, ?string $reason = null): string
    {
        $header = self::header();
        $suffix = self::customerSuffix();
        $cleanedReason = $reason ? ' '.self::sanitize($reason, 20).'.' : '';

        return "{$header} Payment for Order #JFS-{$orderId} was overpaid.{$cleanedReason} Excess amount will be refunded.{$suffix}";
    }

    /**
     * Generic order status update notice to customer.
     */
    public static function statusUpdate(int $orderId, string $status): string
    {
        $header = self::header();
        $suffix = self::customerSuffix();
        $formattedStatus = ucfirst(str_replace('_', ' ', $status));

        return "{$header} Update for Order #JFS-{$orderId}. Status: {$formattedStatus}.{$suffix}";
    }

    /**
     * New order submitted alert to admin/staff.
     */
    public static function newOrderAlert(int $orderId, string $recipientName, float $totalPrice): string
    {
        $header = self::header();
        $cleanName = self::sanitize($recipientName, 25);
        $formattedPrice = number_format($totalPrice, 2);

        return "{$header} Alert: New order #JFS-{$orderId} submitted by {$cleanName}. Total: ₱{$formattedPrice}.";
    }

    /**
     * Payment receipt uploaded alert to admin/staff.
     */
    public static function paymentReviewAlert(int $orderId, ?string $referenceNo = null): string
    {
        $header = self::header();
        $refText = $referenceNo ? ' Ref: '.self::sanitize($referenceNo, 20).'.' : '';

        return "{$header} Alert: New payment proof uploaded for Order #JFS-{$orderId}.{$refText} Action required: Review.";
    }

    public static function paymentUploaded(int $orderId): string
    {
        $header = self::header();
        $suffix = self::customerSuffix();

        return "{$header} Payment proof for Order #JFS-{$orderId} was received and is being reviewed.{$suffix}";
    }

    public static function forEvent(int $orderId, string $eventType, ?string $recipientName = null, ?float $totalPrice = null): string
    {
        return match ($eventType) {
            'new_order_alert' => self::newOrderAlert($orderId, $recipientName ?? 'customer', $totalPrice ?? 0),
            'payment_review_alert' => self::paymentReviewAlert($orderId),
            'payment_uploaded' => self::paymentUploaded($orderId),
            'order_cancelled_customer' => self::customerCancelledAlert($orderId, $recipientName ?? 'customer'),
            'confirmed' => self::orderConfirmed($orderId),
            'preparing', 'shipped' => self::orderPreparing($orderId),
            'delivered' => self::orderDelivered($orderId),
            'ready_for_pickup' => self::orderReadyForPickup($orderId),
            'payment_received', 'payment_verified' => self::paymentVerified($orderId, $totalPrice),
            'payment_failed', 'payment_rejected' => self::paymentRejected($orderId),
            'payment_underpaid' => self::paymentUnderpaid($orderId),
            'payment_overpaid' => self::paymentOverpaid($orderId),
            'cancelled' => self::orderCancelled($orderId),
            default => self::statusUpdate($orderId, $eventType),
        };
    }

    /**
     * Order cancelled by customer alert to admin/staff.
     */
    public static function customerCancelledAlert(int $orderId, string $recipientName, ?string $reason = null): string
    {
        $header = self::header();
        $cleanName = self::sanitize($recipientName, 20);
        $cleanedReason = $reason ? ' Reason: '.self::sanitize($reason, 25).'.' : '';

        return "{$header} Alert: Order #JFS-{$orderId} was cancelled by {$cleanName}.{$cleanedReason}";
    }

    /**
     * Helper to sanitize, strip tags, remove URLs, and truncate dynamic strings.
     */
    protected static function sanitize(string $text, int $maxLength = 50): string
    {
        // Strip HTML tags and newlines
        $clean = strip_tags($text);
        $clean = str_replace(["\r", "\n", "\t"], ' ', $clean);

        // Anti-smishing: remove any accidental http/https or URL patterns
        $clean = preg_replace('/https?:\/\/\S+/i', '', $clean);
        $clean = preg_replace('/\s+/', ' ', trim($clean));

        if (mb_strlen($clean) > $maxLength) {
            return mb_substr($clean, 0, $maxLength - 3).'...';
        }

        return $clean;
    }
}
