import { useState } from 'react';
import { useAdminOrders } from '../../../lib/adminQueries';
import { FlattenedTransaction } from './types';
import { useTransactions } from './hooks/useTransactions';
import { exportTransactionsCSV, printCashUpSlip } from './utils';
import { TransactionMetricsBar } from './components/TransactionMetricsBar';
import { TransactionToolbar } from './components/TransactionToolbar';
import { TransactionTable } from './components/TransactionTable';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { ImageZoomModal } from '../orders/components/ImageZoomModal';

export function TransactionsTab() {
    const { data: orders = [] } = useAdminOrders();
    const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
    const [selectedTx, setSelectedTx] = useState<FlattenedTransaction | null>(null);

    const {
        filteredData,
        metrics,
        globalFilter,
        setGlobalFilter,
        dateQuickFilter,
        setDateQuickFilter,
        statusFilter,
        setStatusFilter,
        methodFilter,
        setMethodFilter,
    } = useTransactions(orders);

    return (
        <div className="space-y-6 select-none">
            {/* Top Financial KPI Metrics */}
            <TransactionMetricsBar metrics={metrics} />

            {/* Filter & Export Toolbar */}
            <TransactionToolbar
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
                dateQuickFilter={dateQuickFilter}
                setDateQuickFilter={setDateQuickFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                methodFilter={methodFilter}
                setMethodFilter={setMethodFilter}
                onExportCSV={() => exportTransactionsCSV(filteredData)}
                onPrintCashUpSlip={() => printCashUpSlip(metrics)}
            />

            {/* TanStack Transactions Data Table */}
            <TransactionTable
                data={filteredData}
                onPreviewReceipt={setPreviewReceipt}
                onSelectTransaction={setSelectedTx}
            />

            {/* Transaction Full Detail Modal */}
            <TransactionDetailModal
                tx={selectedTx}
                onClose={() => setSelectedTx(null)}
                onPreviewReceipt={setPreviewReceipt}
            />

            {/* Receipt Full Preview Lightbox */}
            <ImageZoomModal
                imageUrl={previewReceipt}
                onClose={() => setPreviewReceipt(null)}
            />
        </div>
    );
}

export default TransactionsTab;
