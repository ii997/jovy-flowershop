import { Order } from '../../../types';
import { toast } from '../../ui/Toast';
import { formatPickupTime, getFulfillmentStatusLabel } from '../../../lib/orderDisplay';

export const getStatusStyle = (status: string) => {
    switch (status) {
        case 'verified': return 'bg-emerald-50 text-emerald-700 border border-emerald-300';
        case 'confirmed': return 'bg-amber-50 text-amber-800 border border-amber-300';
        case 'preparing': return 'bg-sky-50 text-sky-800 border border-sky-300';
        case 'ready_for_pickup': return 'bg-emerald-50 text-emerald-700 border border-emerald-300';
        case 'delivered': return 'bg-[#0A2A1B]/10 text-[#0A2A1B] border border-[#0A2A1B]/20';
        case 'cancelled': case 'failed': case 'refunded': return 'bg-rose-50 text-rose-700 border border-rose-300';
        case 'awaiting_verification': return 'bg-amber-100 text-amber-900 border border-amber-400 font-extrabold';
        case 'na': return 'bg-gray-100 text-gray-500 border border-gray-200';
        default: return 'bg-yellow-50 text-yellow-800 border border-yellow-300';
    }
};

export const getPaymentStatusLabel = (ps?: string) => {
    switch (ps) {
        case 'pending': return 'Pending';
        case 'awaiting_verification': return 'Needs Verification';
        case 'verified': return 'Verified';
        case 'failed': return 'Failed';
        case 'refunded': return 'Refunded';
        case 'na': return 'N/A';
        default: return ps || 'N/A';
    }
};

export interface OrderUrgency {
    isUrgent: boolean;
    priority: number; // 2 = funeral (highest), 1 = birthday, 0 = standard
    type: 'funeral' | 'birthday' | null;
    label: string;
    icon: string;
    badgeClass: string;
}

/**
 * Detect order urgency dynamically from items and messages without requiring
 * redundant database columns. Funeral/Memorial takes highest priority, followed by Birthday.
 */
export const getOrderUrgency = (order: Order): OrderUrgency => {
    const items = order.items || [];
    const message = (order.gift_message || '').toLowerCase();

    // Check funeral keywords in message
    const hasFuneralMessage = /(funeral|sympathy|condolence|condolences|wake|burial|cremation|in loving memory|rest in peace|rip)/i.test(message);

    // Check items for funeral / memorial
    const hasFuneralItem = items.some(item => {
        const name = (item.name || '').toLowerCase();
        const p = (item.product as any) || {};
        const cat = (p.category || '').toLowerCase();
        const occs = Array.isArray(p.occasions) ? p.occasions.map((o: any) => String(o).toLowerCase()) : [];

        return (
            cat.includes('funeral') ||
            cat.includes('sympathy') ||
            occs.includes('funeral') ||
            occs.includes('sympathy') ||
            name.includes('funeral') ||
            name.includes('sympathy') ||
            name.includes('condolence') ||
            name.includes('wreath') ||
            name.includes('memorial')
        );
    });

    if (hasFuneralItem || hasFuneralMessage) {
        return {
            isUrgent: true,
            priority: 2,
            type: 'funeral',
            label: 'Funeral Priority',
            icon: '🕊️',
            badgeClass: 'bg-purple-100 text-purple-900 border border-purple-300 font-bold',
        };
    }

    // Check birthday keywords in message
    const hasBirthdayMessage = /(birthday|bday|happy birthday|hbd|born on)/i.test(message);

    // Check items for birthday
    const hasBirthdayItem = items.some(item => {
        const name = (item.name || '').toLowerCase();
        const p = (item.product as any) || {};
        const cat = (p.category || '').toLowerCase();
        const occs = Array.isArray(p.occasions) ? p.occasions.map((o: any) => String(o).toLowerCase()) : [];

        return (
            cat.includes('birthday') ||
            occs.includes('birthday') ||
            name.includes('birthday') ||
            name.includes('bday')
        );
    });

    if (hasBirthdayItem || hasBirthdayMessage) {
        return {
            isUrgent: true,
            priority: 1,
            type: 'birthday',
            label: 'Birthday Priority',
            icon: '🎂',
            badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
        };
    }

    return {
        isUrgent: false,
        priority: 0,
        type: null,
        label: '',
        icon: '',
        badgeClass: '',
    };
};

export const printOrderSlip = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast.error('Unable to open print preview. Please check popup permissions.');
        return;
    }

    const itemsList = (order.items || []).map(item => `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px dashed #e2e8f0; padding-bottom:6px;">
            <div>
                <strong style="font-size:14px; color:#0A2A1B;">${item.name}</strong>
                <div style="font-size:11px; color:#64748b;">Qty: ${item.quantity} | ₱${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <div style="font-size:14px; font-weight:bold; color:#0A2A1B;">₱${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Florist Assembly Slip - #JFS-${order.id}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0A2A1B; line-height: 1.4; }
                .header { text-align: center; border-bottom: 2px solid #0A2A1B; padding-bottom: 12px; margin-bottom: 16px; }
                .title { font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; color: #0A2A1B; }
                .subtitle { font-size: 11px; color: #D97706; font-weight: bold; margin-top: 4px; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; font-size: 12px; }
                .card { background: #FAF9F6; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
                .card h4 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #64748b; }
                .message-card { background: #fefce8; border: 1px solid #fef08a; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-style: italic; font-size: 12px; }
                .total { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; border-top: 2px solid #0A2A1B; padding-top: 10px; margin-top: 16px; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">Jovy's Flowershop</div>
                <div class="subtitle">FLORIST ASSEMBLY & DISPATCH SLIP</div>
                <div style="font-size:13px; font-weight:bold; margin-top:6px;">ORDER #JFS-${order.id} (${order.order_type.toUpperCase()})</div>
            </div>

            <div class="grid">
                <div class="card">
                    <h4>Recipient Information</h4>
                    <div><strong>${order.recipient_name}</strong></div>
                    <div>Phone: ${order.recipient_phone}</div>
                    <div>Fulfillment: Store Pickup</div>
                </div>
                <div class="card">
                    <h4>Scheduled Handoff</h4>
                    <div><strong>Date: ${order.pickup_date || 'N/A'}</strong></div>
                    <div><strong>Time: ${formatPickupTime(order.pickup_time)}</strong></div>
                    <div>Status: ${getFulfillmentStatusLabel(order.status)}</div>
                    <div>Payment: ${order.payment_status?.toUpperCase() || 'PENDING'}</div>
                </div>
            </div>

            ${order.gift_message ? `
                <div class="message-card">
                    <div style="font-weight:bold; font-style:normal; font-size:10px; text-transform:uppercase; color:#854d0e; margin-bottom:4px;">Card Message for Recipient:</div>
                    "${order.gift_message}"
                </div>
            ` : ''}

            <div style="margin-bottom:12px;">
                <div style="font-size:11px; font-weight:bold; text-transform:uppercase; color:#64748b; margin-bottom:8px;">Arrangement Composition & Items:</div>
                ${itemsList}
            </div>

            <div class="total">
                <span>Grand Total:</span>
                <span>₱${parseFloat(order.total_price.toString()).toFixed(2)}</span>
            </div>

            <div style="margin-top:30px; font-size:10px; color:#94a3b8; text-align:center;">
                Assembled By: ___________________ | Inspected By: ___________________ | Date: ____________
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

export const printOrderSummaryReport = (orders: Order[], filterDescription: string = 'Current Orders Filter') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast.error('Unable to open print preview. Please check popup permissions.');
        return;
    }

    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_price.toString()) || 0), 0);
    const verifiedOrders = orders.filter(o => o.payment_status === 'verified').length;
    const pendingOrders = orders.filter(o => o.payment_status === 'pending' || o.payment_status === 'awaiting_verification').length;

    const rowsHtml = orders.map(o => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 8px 6px; font-weight: bold; font-family: monospace;">#JFS-${o.id}</td>
            <td style="padding: 8px 6px;">${o.recipient_name}</td>
            <td style="padding: 8px 6px;">${o.recipient_phone || '—'}</td>
            <td style="padding: 8px 6px; text-transform: uppercase;">${o.order_type}</td>
            <td style="padding: 8px 6px;">${o.pickup_date || 'N/A'} at ${formatPickupTime(o.pickup_time)}</td>
            <td style="padding: 8px 6px; text-transform: capitalize;">${getFulfillmentStatusLabel(o.status)}</td>
            <td style="padding: 8px 6px; font-weight: 600; text-transform: uppercase;">${o.payment_status || 'PENDING'}</td>
            <td style="padding: 8px 6px; text-align: right; font-weight: bold; font-family: monospace;">₱${(parseFloat(o.total_price.toString()) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
    `).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Orders Summary Report - Jovy's Flowershop</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0A2A1B; line-height: 1.4; }
                .header { text-align: center; border-bottom: 2px solid #0A2A1B; padding-bottom: 12px; margin-bottom: 16px; }
                .title { font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; color: #0A2A1B; }
                .subtitle { font-size: 11px; color: #D97706; font-weight: bold; margin-top: 4px; }
                .meta { font-size: 12px; color: #64748b; margin-top: 6px; }
                .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
                .kpi-card { background: #FAF9F6; border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; }
                .kpi-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; }
                .kpi-value { font-size: 16px; font-weight: 800; color: #0A2A1B; margin-top: 2px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { text-align: left; padding: 8px 6px; font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #0A2A1B; }
                .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 12px; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">Jovy's Flowershop</div>
                <div class="subtitle">ORDERS AUDIT & FULFILLMENT SUMMARY REPORT</div>
                <div class="meta">Scope: ${filterDescription} • Generated: ${new Date().toLocaleString('en-PH')}</div>
            </div>

            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-title">Listed Orders</div>
                    <div class="kpi-value">${orders.length}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">Gross Total Value</div>
                    <div class="kpi-value">₱${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">Verified Paid</div>
                    <div class="kpi-value">${verifiedOrders}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">Pending Verification</div>
                    <div class="kpi-value">${pendingOrders}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Recipient</th>
                        <th>Phone</th>
                        <th>Type</th>
                        <th>Schedule</th>
                        <th>Fulfillment</th>
                        <th>Payment</th>
                        <th style="text-align: right;">Total (PHP)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="8" style="text-align:center; padding: 20px; color:#94a3b8;">No orders recorded in this filter.</td></tr>'}
                </tbody>
            </table>

            <div class="footer">
                <div>Prepared By: Store Cashier / Admin</div>
                <div>Fulfillment Lead: ____________________</div>
                <div>Page 1 of 1</div>
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
