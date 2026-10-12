import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyReceiptText } from '../../resources/js/lib/receiptOcrValidation.ts';

test('rejects unrelated text even when it contains an amount and date', () => {
    const result = classifyReceiptText(
        'Summer festival poster 2026-10-12 PHP 500.00',
        { amount: '500.00', referenceNo: '', transactionDate: '2026-10-12' },
        98
    );

    assert.equal(result.isReceipt, false);
    assert.equal(result.requiresManualReview, false);
});

test('accepts a payment confirmation with partial extracted details for review', () => {
    const result = classifyReceiptText(
        'Payment successful. Amount sent: PHP 500.00',
        { amount: '500.00', referenceNo: '', transactionDate: '' },
        92
    );

    assert.equal(result.isReceipt, true);
    assert.equal(result.requiresManualReview, true);
});

test('accepts transfer language with a reference number for review', () => {
    const result = classifyReceiptText(
        'You sent money via InstaPay. Reference number: 123456789012',
        { amount: '', referenceNo: '123456789012', transactionDate: '' },
        88
    );

    assert.equal(result.isReceipt, true);
    assert.equal(result.requiresManualReview, true);
});

test('rejects payment wording when no amount, reference, or date was extracted', () => {
    const result = classifyReceiptText(
        'Payment successful. Thank you.',
        { amount: '', referenceNo: '', transactionDate: '' },
        94
    );

    assert.equal(result.isReceipt, false);
});

test('does not treat extracted details without payment language as a receipt', () => {
    const result = classifyReceiptText(
        'Invoice details',
        { amount: '500.00', referenceNo: '123456789012', transactionDate: '2026-10-12' },
        99
    );

    assert.equal(result.isReceipt, false);
});

test('flags low-confidence OCR for manual review', () => {
    const result = classifyReceiptText(
        'Transfer completed. Amount: PHP 500.00. Ref: 123456789012. Date: 2026-10-12',
        { amount: '500.00', referenceNo: '123456789012', transactionDate: '2026-10-12' },
        42
    );

    assert.equal(result.isReceipt, true);
    assert.equal(result.requiresManualReview, true);
});

test('does not require manual review when all details are read confidently', () => {
    const result = classifyReceiptText(
        'Transfer completed. Amount: PHP 500.00. Ref: 123456789012. Date: 2026-10-12',
        { amount: '500.00', referenceNo: '123456789012', transactionDate: '2026-10-12' },
        92
    );

    assert.equal(result.isReceipt, true);
    assert.equal(result.requiresManualReview, false);
});
