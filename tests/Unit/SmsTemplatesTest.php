<?php

namespace Tests\Unit;

use App\Services\SmsTemplates;
use Tests\TestCase;

class SmsTemplatesTest extends TestCase
{
    public function test_header_uses_config_sender_name()
    {
        config(['sms.sender_name' => "Jovy's Flowershop"]);
        $this->assertEquals("Jovy's Flowershop:", SmsTemplates::header());

        config(['sms.sender_name' => 'JFS Florist']);
        $this->assertEquals('JFS Florist:', SmsTemplates::header());
    }

    public function test_customer_templates_render_expected_text_and_suffix()
    {
        config(['sms.sender_name' => "Jovy's Flowershop"]);

        $confirmed = SmsTemplates::orderConfirmed(101);
        $this->assertStringContainsString('Order #JFS-101 has been confirmed', $confirmed);
        $this->assertStringEndsWith('(Do not reply)', $confirmed);

        $preparing = SmsTemplates::orderPreparing(102);
        $this->assertStringContainsString('Order #JFS-102 is now being prepared', $preparing);
        $this->assertStringEndsWith('(Do not reply)', $preparing);

        $delivered = SmsTemplates::orderDelivered(103);
        $this->assertStringContainsString('Order #JFS-103 has been picked up', $delivered);
        $this->assertStringEndsWith('(Do not reply)', $delivered);

        $ready = SmsTemplates::orderReadyForPickup(103, '9:00 AM');
        $this->assertStringContainsString('Order #JFS-103 is ready for pickup at 9:00 AM', $ready);
        $this->assertStringEndsWith('(Do not reply)', $ready);

        $cancelled = SmsTemplates::orderCancelled(104, 'Out of stock');
        $this->assertStringContainsString('Order #JFS-104 has been cancelled', $cancelled);
        $this->assertStringEndsWith('(Do not reply)', $cancelled);

        $verified = SmsTemplates::paymentVerified(105, 1500.00);
        $this->assertStringContainsString('Payment for Order #JFS-105 (₱1,500.00) has been verified', $verified);
        $this->assertStringEndsWith('(Do not reply)', $verified);

        $rejected = SmsTemplates::paymentRejected(106, 'Blurry receipt');
        $this->assertStringContainsString('Payment proof for Order #JFS-106 could not be verified', $rejected);
        $this->assertStringEndsWith('(Do not reply)', $rejected);

        $underpaid = SmsTemplates::paymentUnderpaid(107, 'Short by 200');
        $this->assertStringContainsString('Payment for Order #JFS-107 is underpaid', $underpaid);
        $this->assertStringEndsWith('(Do not reply)', $underpaid);

        $overpaid = SmsTemplates::paymentOverpaid(108, 'Excess 500');
        $this->assertStringContainsString('Payment for Order #JFS-108 was overpaid', $overpaid);
        $this->assertStringEndsWith('(Do not reply)', $overpaid);

        $status = SmsTemplates::statusUpdate(109, 'processing');
        $this->assertStringContainsString('Update for Order #JFS-109. Status: Processing', $status);
        $this->assertStringEndsWith('(Do not reply)', $status);
    }

    public function test_admin_templates_render_expected_text()
    {
        config(['sms.sender_name' => "Jovy's Flowershop"]);

        $this->assertStringContainsString('Alert: New order #JFS-201 submitted by Maria Santos. Total: ₱2,500.00.', SmsTemplates::newOrderAlert(201, 'Maria Santos', 2500.00));
        $this->assertStringContainsString('Alert: New payment proof uploaded for Order #JFS-202. Ref: GCASH-9988.', SmsTemplates::paymentReviewAlert(202, 'GCASH-9988'));
        $this->assertStringContainsString('Alert: Order #JFS-203 was cancelled by John Doe. Reason: Schedule conflict.', SmsTemplates::customerCancelledAlert(203, 'John Doe', 'Schedule conflict'));
    }

    public function test_all_templates_strictly_url_free_anti_smishing()
    {
        $templates = [
            SmsTemplates::orderConfirmed(1),
            SmsTemplates::orderPreparing(1),
            SmsTemplates::orderReadyForPickup(1, '9:00 AM'),
            SmsTemplates::orderDelivered(1),
            SmsTemplates::orderCancelled(1, 'Please visit http://example.com/cancel for details'),
            SmsTemplates::paymentVerified(1, 999.00),
            SmsTemplates::paymentRejected(1, 'Upload here: https://phishing.site/upload'),
            SmsTemplates::paymentUnderpaid(1, 'Pay at http://pay.me'),
            SmsTemplates::paymentOverpaid(1, 'Check https://refund.com'),
            SmsTemplates::statusUpdate(1, 'shipped'),
            SmsTemplates::newOrderAlert(1, 'Bob http://malicious.org', 1200.00),
            SmsTemplates::paymentReviewAlert(1, 'https://bank.com/receipt/123'),
            SmsTemplates::customerCancelledAlert(1, 'Alice https://evil.com', 'Changed mind at http://site.com'),
        ];

        foreach ($templates as $msg) {
            $this->assertStringNotContainsString('http://', $msg);
            $this->assertStringNotContainsString('https://', $msg);
        }
    }

    public function test_all_templates_fit_single_segment_gsm7_character_budget()
    {
        config(['sms.sender_name' => "Jovy's Flowershop"]);

        $veryLongName = 'Maria Clara Juana Dela Cruz Rodriguez Fernandez';
        $veryLongReason = 'Due to unexpected severe weather disturbances and road closures in the metropolitan area';
        $veryLongRef = 'GCASH-TXN-2026-999988887777666655554444333322221111';

        $templates = [
            SmsTemplates::orderConfirmed(99999),
            SmsTemplates::orderPreparing(99999),
            SmsTemplates::orderReadyForPickup(99999, '9:00 AM'),
            SmsTemplates::orderDelivered(99999),
            SmsTemplates::orderCancelled(99999, $veryLongReason),
            SmsTemplates::paymentVerified(99999, 999999.99),
            SmsTemplates::paymentRejected(99999, $veryLongReason),
            SmsTemplates::paymentUnderpaid(99999, $veryLongReason),
            SmsTemplates::paymentOverpaid(99999, $veryLongReason),
            SmsTemplates::statusUpdate(99999, 'out_for_delivery'),
            SmsTemplates::newOrderAlert(99999, $veryLongName, 125000.00),
            SmsTemplates::paymentReviewAlert(99999, $veryLongRef),
            SmsTemplates::customerCancelledAlert(99999, $veryLongName, $veryLongReason),
        ];

        foreach ($templates as $msg) {
            $length = mb_strlen($msg);
            $this->assertLessThanOrEqual(
                140,
                $length,
                "Template exceeded 140 GSM character budget ({$length} chars): '{$msg}'"
            );
        }
    }
}
