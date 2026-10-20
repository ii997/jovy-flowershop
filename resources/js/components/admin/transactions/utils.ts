import { toast } from '../../ui/Toast';
import { FlattenedTransaction, TransactionMetrics } from './types';

export const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    toast.success(`Copied "${ref}" to clipboard!`);
};

export const formatTransactionMethod = (method: string) => {
    if (method.toLowerCase().includes('gcash') || method.toLowerCase().includes('online')) {
        return 'Online';
    }

    return method.replace(/in-store/gi, 'Walkin');
};

export const exportTransactionsCSV = (data: FlattenedTransaction[]) => {
    if (data.length === 0) {
        toast.error('No transactions available to export.');
        return;
    }

    const headers = ['Order ID', 'Customer Name', 'Contact Phone', 'Payment Method', 'Reference No', 'Amount (PHP)', 'Status', 'Date Time'];
    const rows = data.map(tx => [
        `#JFS-${tx.order_id}`,
        `"${tx.customer_name.replace(/"/g, '""')}"`,
        tx.customer_phone || '',
        `"${tx.method}"`,
        tx.reference_no || '',
        tx.amount.toFixed(2),
        tx.payment_status,
        `"${new Date(tx.created_at).toLocaleString('en-PH')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jovys_transactions_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Financial ledger CSV exported successfully!');
};

export const printCashUpSlip = (metrics: TransactionMetrics) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast.error('Unable to open print preview.');
        return;
    }

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Daily Financial Reconciliation - Jovy's Flowershop</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0A2A1B; line-height: 1.5; }
                .header { text-align: center; border-bottom: 2px solid #0A2A1B; padding-bottom: 12px; margin-bottom: 20px; }
                .title { font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; }
                .subtitle { font-size: 11px; color: #D97706; font-weight: bold; margin-top: 4px; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; font-size: 13px; }
                .card { background: #FAF9F6; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; }
                .card h4 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #64748b; }
                .total { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; border-top: 2px solid #0A2A1B; padding-top: 10px; margin-top: 16px; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">Jovy's Flowershop</div>
                <div class="subtitle">DAILY FINANCIAL CASH-UP & RECONCILIATION REPORT</div>
                <div style="font-size:12px; margin-top:6px; color:#64748b;">Generated: ${new Date().toLocaleString('en-PH')}</div>
            </div>

            <div class="grid">
                <div class="card">
                    <h4>Revenue Collection</h4>
                    <div>Verified Revenue: <strong>₱${metrics.totalVerifiedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></div>
                    <div>Pending Review: <strong>₱${metrics.totalPendingAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></div>
                    <div>Total Transactions: <strong>${metrics.totalCount}</strong></div>
                </div>
                <div class="card">
                    <h4>Payment Channel Split</h4>
                    <div>Online / E-Wallet: <strong>${metrics.gcashCount} payments</strong></div>
                    <div>Cash / Walkin: <strong>${metrics.cashCount} payments</strong></div>
                </div>
            </div>

            <div style="margin-top:40px; font-size:11px; color:#94a3b8; display:flex; justify-content:space-between;">
                <div>Shift Cashier: ____________________</div>
                <div>Store Manager: ____________________</div>
                <div>Date Verified: ____________________</div>
            </div>

        </body>
        </html>
    `;

    printWindow.addEventListener('load', () => printWindow.print(), { once: true });
    printWindow.document.write(html);
    printWindow.document.close();
};

export const printTransactionReceipt = (tx: FlattenedTransaction) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast.error('Unable to open print preview.');
        return;
    }

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Receipt - #JFS-${tx.order_id}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0A2A1B; line-height: 1.5; }
                .header { text-align: center; border-bottom: 2px solid #0A2A1B; padding-bottom: 12px; margin-bottom: 20px; }
                .title { font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; }
                .subtitle { font-size: 11px; color: #D97706; font-weight: bold; margin-top: 4px; }
                .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
                .info-table td { padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
                .label { color: #64748b; font-size: 12px; }
                .val { text-align: right; font-weight: bold; }
                .amount-box { background: #FAF9F6; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; margin: 20px 0; }
                .amount-label { font-size: 11px; text-transform: uppercase; color: #64748b; }
                .amount-val { font-size: 24px; font-weight: 800; color: #D97706; font-family: monospace; }
                .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">Jovy's Flowershop</div>
                <div class="subtitle">OFFICIAL PAYMENT RECEIPT & AUDIT SLIP</div>
                <div style="font-size:12px; margin-top:6px; color:#64748b;">Transaction for Order #JFS-${tx.order_id}</div>
            </div>

            <div class="amount-box">
                <div class="amount-label">Total Amount Paid</div>
                <div class="amount-val">₱${Number(tx.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <table class="info-table">
                <tr>
                    <td class="label">Customer Name</td>
                    <td class="val">${tx.customer_name}</td>
                </tr>
                ${tx.customer_phone ? `
                <tr>
                    <td class="label">Contact Phone</td>
                    <td class="val" style="font-family: monospace;">${tx.customer_phone}</td>
                </tr>` : ''}
                <tr>
                    <td class="label">Payment Method</td>
                    <td class="val">${formatTransactionMethod(tx.method)}</td>
                </tr>
                <tr>
                    <td class="label">Reference / Tracking No.</td>
                    <td class="val" style="font-family: monospace;">${tx.reference_no || 'None Provided'}</td>
                </tr>
                <tr>
                    <td class="label">Payment Status</td>
                    <td class="val" style="text-transform: uppercase;">${tx.payment_status}</td>
                </tr>
                <tr>
                    <td class="label">Transaction Timestamp</td>
                    <td class="val">${new Date(tx.created_at).toLocaleString('en-PH')}</td>
                </tr>
                ${tx.admin_notes ? `
                <tr>
                    <td class="label">Auditor / Staff Notes</td>
                    <td class="val">${tx.admin_notes}</td>
                </tr>` : ''}
            </table>

            <div class="footer">
                <div>Thank you for choosing Jovy's Flowershop!</div>
                <div style="margin-top: 4px;">Verified by Store Cashier / System Auditor</div>
            </div>

        </body>
        </html>
    `;

    printWindow.addEventListener('load', () => printWindow.print(), { once: true });
    printWindow.document.write(html);
    printWindow.document.close();
};
