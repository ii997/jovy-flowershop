import { toast } from '../../ui/Toast';
import { FlattenedTransaction, TransactionMetrics } from './types';

export const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    toast.success(`Copied "${ref}" to clipboard!`);
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
                    <div>GCash / E-Wallet: <strong>${metrics.gcashCount} payments</strong></div>
                    <div>Cash / In-Store: <strong>${metrics.cashCount} payments</strong></div>
                    <div>Average Ticket Size: <strong>₱${metrics.avgTicket.toFixed(2)}</strong></div>
                </div>
            </div>

            <div style="margin-top:40px; font-size:11px; color:#94a3b8; display:flex; justify-content:space-between;">
                <div>Shift Cashier: ____________________</div>
                <div>Store Manager: ____________________</div>
                <div>Date Verified: ____________________</div>
            </div>

            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};
