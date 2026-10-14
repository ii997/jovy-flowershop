export const formatPickupTime = (time?: string | null) => {
    if (!time) return 'Time to be confirmed';

    const normalized = time.includes('T') ? time : `1970-01-01T${time}`;
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    const match = time.match(/^(\d{2}):(\d{2})/);
    if (!match) return time;

    const hour = Number(match[1]);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${match[2]} ${suffix}`;
};

export const formatPickupSchedule = (date?: string | null, time?: string | null) => {
    const pickupDate = date || 'Date to be confirmed';
    return `${pickupDate} at ${formatPickupTime(time)}`;
};

export const getFulfillmentStatusLabel = (status?: string | null) => {
    switch (status) {
        case 'pending': return 'Pending';
        case 'confirmed': return 'Confirmed';
        case 'preparing': return 'Preparing';
        case 'ready_for_pickup': return 'Ready to pickup';
        case 'delivered': return 'Picked up';
        case 'cancelled': return 'Cancelled';
        default: return status || 'Pending';
    }
};
