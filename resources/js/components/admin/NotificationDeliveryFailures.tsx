import { useEffect, useState } from 'react';

interface DeliveryFailure {
    id: number;
    channel: string;
    event: string;
    recipient: string;
    attempts: number;
    error_details: string | null;
    created_at: string;
    order?: { id: number } | null;
}

export function NotificationDeliveryFailures() {
    const [failures, setFailures] = useState<DeliveryFailure[]>([]);

    useEffect(() => {
        fetch('/api/admin/notification-deliveries', { headers: { Accept: 'application/json' } })
            .then((response) => response.ok ? response.json() : [])
            .then(setFailures)
            .catch(() => setFailures([]));
    }, []);

    return (
        <section className="bg-white rounded-3xl border border-[#0A2A1B]/10 p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-[#0A2A1B]/10 pb-3">
                <div>
                    <h2 className="text-lg font-bold text-[#0A2A1B] font-serif">Failed Notification Deliveries</h2>
                    <p className="text-[10px] text-[#0A2A1B]/50 mt-1">Permanent email and SMS failures after all retries.</p>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-3 py-1">
                    {failures.length}
                </span>
            </div>

            {failures.length === 0 ? (
                <p className="text-sm text-[#0A2A1B]/50 py-6">No permanent delivery failures.</p>
            ) : (
                <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left text-xs">
                        <thead className="text-[10px] uppercase tracking-wider text-[#0A2A1B]/50">
                            <tr>
                                <th className="py-2 pr-4">Order</th>
                                <th className="py-2 pr-4">Channel</th>
                                <th className="py-2 pr-4">Event</th>
                                <th className="py-2 pr-4">Recipient</th>
                                <th className="py-2 pr-4">Attempts</th>
                                <th className="py-2">Failure</th>
                            </tr>
                        </thead>
                        <tbody>
                            {failures.map((failure) => (
                                <tr key={failure.id} className="border-t border-[#0A2A1B]/5 align-top">
                                    <td className="py-3 pr-4 font-mono">{failure.order ? `#JFS-${failure.order.id}` : '—'}</td>
                                    <td className="py-3 pr-4 uppercase font-bold">{failure.channel}</td>
                                    <td className="py-3 pr-4">{failure.event}</td>
                                    <td className="py-3 pr-4">{failure.recipient}</td>
                                    <td className="py-3 pr-4">{failure.attempts}</td>
                                    <td className="py-3 max-w-xs text-rose-700">{failure.error_details || 'Unknown failure'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
