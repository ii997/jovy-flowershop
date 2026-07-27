export interface User {
    id: number;
    name: string;
    email: string;
    role: 'customer' | 'staff' | 'admin';
    deletion_requested_at?: string | null;
}

export interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    image: string;
    description: string;
    rating: number;
    occasions: string[];
    seasons: string[];
    dimensions: string;
    availability: boolean;
    quantity: number;
    gallery: string[];
    stems?: Record<string, number> | null;
}

export interface OrderItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    product?: Record<string, any>;
}

export interface Order {
    id: number;
    recipient_name: string;
    recipient_phone: string;
    pickup_date: string;
    order_type: string;
    total_price: number | string;
    gift_message?: string;
    items?: OrderItem[];
    status: string;
    payment_receipt?: string;
    payment_details?: {
        reference_no?: string;
        amount?: string | number;
        transaction_date?: string;
    };
    payment_status?: string;
    payment_transactions?: PaymentTransaction[];
    cancellation?: OrderCancellation | null;
    user?: User;
}

export interface DashboardStats {
    gross_sales: number;
    total_orders: number;
    active_listings: number;
    recent_orders: Order[];
    revenue_tracking: { paid: number; pending: number };
    top_products: { id: number; name: string; count: number }[];
    occasions_breakdown: Record<string, number>;
    seasons_breakdown: Record<string, number>;
    trends: { daily: any[]; monthly: any[]; yearly: any[] };
    patterns: { average_order_size: number; repeat_rate: number; total_customers: number };
}

export interface Flower {
    id: number;
    name: string;
    price: number;
    quantity: number;
    available: boolean;
    created_at: string;
    updated_at: string;
}


export interface PaymentTransaction {
    id: number;
    order_id: number;
    type: string;
    amount: number;
    method: string | null;
    reference_no: string | null;
    receipt_image: string | null;
    admin_notes: string | null;
    verified_by: number | null;
    verified_at: string | null;
    created_at?: string;
}

export interface OrderCancellation {
    id: number;
    order_id: number;
    cancelled_by: number;
    reason: string;
    refund_amount: number | null;
    refund_method: string | null;
}

export interface CartItem {
    product: Product;
    quantity: number;
}
