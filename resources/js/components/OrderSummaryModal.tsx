import React, { useState, useRef, useEffect } from 'react';
import { Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationTransition } from './animations';
import { useReceiptOcr } from '../lib/hooks/useReceiptOcr';
import { OrderSummaryDetails } from './OrderSummaryDetails';
import { InstaPayQr } from './InstaPayQr';

interface OrderSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onPaymentSuccess?: () => void;
}

export function OrderSummaryModal({ isOpen, onClose, order, onPaymentSuccess }: OrderSummaryModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [customQrImage, setCustomQrImage] = useState<string | null>(null);

    const {
        selectedFile,
        setSelectedFile,
        previewUrl,
        setPreviewUrl,
        uploadError,
        setUploadError,
        isUploading,
        setIsUploading,
        uploadSuccess,
        setUploadSuccess,
        isOcrLoading,
        ocrProgress,
        refNo,
        paymentAmount,
        txnDate,
        validateAndSetFile,
    } = useReceiptOcr(order, isOpen);

    useEffect(() => {
        if (isOpen) {
            try {
                const savedQr = localStorage.getItem('store_settings_qr_image');
                setCustomQrImage(savedQr || null);
            } catch (e) {
                console.error("Failed to load custom QR image", e);
            }
        }
    }, [isOpen]);

    const csrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setUploadError('');
        if (file) {
            validateAndSetFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        setUploadError('');
        if (file) validateAndSetFile(file);
    };

    const handleSubmitReceipt = async () => {
        if (!selectedFile || !order) return;

        setIsUploading(true);
        setUploadError('');

        const formData = new FormData();
        formData.append('receipt', selectedFile);
        formData.append('reference_no', refNo);
        formData.append('amount', paymentAmount);
        formData.append('transaction_date', txnDate);

        try {
            const res = await fetch(`/api/orders/${order.id}/payment`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: formData,
            });

            if (res.ok) {
                setUploadSuccess(true);
                setSelectedFile(null);
                setPreviewUrl('');
                if (onPaymentSuccess) {
                    setTimeout(() => {
                        onPaymentSuccess();
                    }, 1200);
                }
            } else {
                const data = await res.json().catch(() => null);
                setUploadError(data?.message || 'Failed to submit payment receipt.');
            }
        } catch {
            setUploadError('Connection error. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const transition = useAnimationTransition('elegant');

    const totalPrice = order
        ? (typeof order.total_price === 'number' ? order.total_price : parseFloat(order.total_price || '0'))
        : 0;

    const isReservation = order?.order_type === 'reservation';
    const downpaymentPct = isReservation ? parseInt(localStorage.getItem('store_settings_downpayment_pct') || '30') : 100;
    const expectedPaymentAmount = isReservation ? totalPrice * (downpaymentPct / 100.0) : totalPrice;

    // Security layer: detect amount mismatch between OCR-extracted value and expected payment total
    const parsedPaymentAmount = parseFloat(paymentAmount.replace(/,/g, '') || '0');
    const amountMismatch = paymentAmount !== '' && !isOcrLoading && Math.abs(parsedPaymentAmount - expectedPaymentAmount) > 0.01;

    return (
        <AnimatePresence>
            {isOpen && order && (
                <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <motion.div
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-[#0A2A1B]/40 backdrop-blur-sm"
                    />

                    {/* Modal Body */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={transition}
                        className="relative bg-white max-w-3xl w-full mx-4 rounded-3xl shadow-2xl p-8 border border-[#0A2A1B]/10 z-10 flex flex-col space-y-6 select-none max-h-[90vh] overflow-y-auto origin-center"
                    >
                        <div className="flex justify-between items-center pb-2 border-b border-[#0A2A1B]/10">
                            <div>
                                <h3 className="text-xl font-bold text-[#0A2A1B] font-serif">Order Confirmation</h3>
                                <p className="text-xs text-[#0A2A1B]/60">Order ID: #JFS-{order.id}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-full hover:bg-[#0A2A1B]/5 text-[#0A2A1B]/60 hover:text-[#0A2A1B] cursor-pointer transition-all active:scale-90"
                                aria-label="Close summary"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Order Summary Details */}
                            <OrderSummaryDetails order={order} totalPrice={totalPrice} />

                            {/* Right Column: InstaPay & Payment Submission */}
                            <div className="space-y-5">
                                <InstaPayQr totalPrice={expectedPaymentAmount} customQrImage={customQrImage} />

                                <div className="space-y-1.5 text-[11px] text-[#0A2A1B]/75 leading-relaxed bg-[#F7F4EB] p-4 rounded-2xl border border-[#0A2A1B]/5">
                                    <strong className="text-[#0A2A1B] block">Instructions:</strong>
                                    <ol className="list-decimal pl-4 space-y-1">
                                        <li>Open your banking app (BDO, GCash, Maya, etc.).</li>
                                        <li>Select "Scan QR" and upload/scan this QR code, or enter the account details above manually.</li>
                                        <li>Send exactly <span className="font-bold text-[#0A2A1B]">₱{expectedPaymentAmount.toFixed(2)}</span> {isReservation ? `(${downpaymentPct}% downpayment required)` : ''} via InstaPay.</li>
                                        <li>Take a screenshot of the receipt and upload it below.</li>
                                    </ol>
                                </div>

                                {uploadSuccess ? (
                                    <div className="bg-green-50 border border-green-200 text-green-800 p-5 rounded-2xl text-center space-y-2">
                                        <svg className="h-6 w-6 mx-auto text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                        <h4 className="font-bold text-sm">Receipt Submitted!</h4>
                                        <p className="text-xs text-green-700">Thank you. We will verify your payment receipt shortly and process your floral arrangement.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <span className="text-xs font-bold text-[#0A2A1B]/40 uppercase tracking-wider block">Submit Payment Receipt</span>
                                        
                                        <div
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-[#0A2A1B]/15 hover:border-[#D97706]/40 hover:bg-[#D97706]/[0.02] p-5 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                                        >
                                            {previewUrl ? (
                                                <div className="relative w-full max-h-36 overflow-hidden rounded-xl border border-gray-200">
                                                    <img src={previewUrl} alt="Receipt preview" className="w-full h-full object-contain max-h-32" />
                                                </div>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#0A2A1B]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-xs text-center text-[#0A2A1B]/55 font-semibold">Drag & drop receipt screenshot or <span className="text-[#D97706]">browse</span></span>
                                                    <span className="text-[10px] text-[#0A2A1B]/35">JPG, PNG · Max 3 MB</span>
                                                </>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                        </div>
                                        {isOcrLoading && (
                                            <div className="bg-[#D97706]/5 border border-[#D97706]/10 p-4 rounded-2xl flex flex-col gap-2">
                                                <div className="flex justify-between items-center text-[10px] font-bold text-[#D97706] uppercase tracking-wider">
                                                    <span>Running InstaPay OCR...</span>
                                                    <span>{ocrProgress}%</span>
                                                </div>
                                                <div className="w-full bg-[#D97706]/10 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-[#D97706] h-full transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                                                </div>
                                            </div>
                                        )}

                                        {selectedFile && !isOcrLoading && (
                                            <div className="bg-[#FAF9F6] border border-[#0A2A1B]/10 p-4 rounded-2xl space-y-3">
                                                <span className="text-[10px] font-bold text-[#0A2A1B]/50 uppercase tracking-wider block">✿ Verify extracted transaction details</span>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider">Reference ID #</label>
                                                        <input
                                                            type="text"
                                                            value={refNo}
                                                            readOnly
                                                            className="px-3 py-2 border border-[#0A2A1B]/15 bg-[#0A2A1B]/[0.03] text-[#0A2A1B] font-semibold rounded-xl focus:outline-none cursor-default"
                                                            placeholder="Reference Number"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <label className={`text-[10px] font-bold uppercase tracking-wider ${amountMismatch ? 'text-red-600' : 'text-[#0A2A1B]/60'}`}>Amount (₱)</label>
                                                        <input
                                                            type="text"
                                                            value={paymentAmount}
                                                            readOnly
                                                            className={`px-3 py-2 border-2 font-semibold rounded-xl focus:outline-none cursor-default transition-colors ${
                                                                amountMismatch
                                                                    ? 'border-red-500 text-red-700 bg-red-50/50'
                                                                    : 'border-[#0A2A1B]/15 text-[#0A2A1B] bg-[#0A2A1B]/[0.03]'
                                                            }`}
                                                            placeholder="Amount"
                                                        />
                                                        {amountMismatch && (
                                                            <div className="flex items-start gap-1.5 mt-1 px-1">
                                                                <svg className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span className="text-[10px] text-red-600 font-semibold leading-tight">
                                                                    Amount mismatch — receipt shows ₱{parsedPaymentAmount.toFixed(2)} but expected payment is ₱{expectedPaymentAmount.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1 sm:col-span-2">
                                                        <label className="text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider">Transaction Date & Time</label>
                                                        <input
                                                            type="text"
                                                            value={txnDate}
                                                            readOnly
                                                            className="px-3 py-2 border border-[#0A2A1B]/15 bg-[#0A2A1B]/[0.03] text-[#0A2A1B] font-semibold rounded-xl focus:outline-none cursor-default"
                                                            placeholder="Transaction Date"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {uploadError && (
                                            <p className="text-red-600 text-xs">{uploadError}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedFile && !isOcrLoading && !uploadSuccess && (
                            <div className="pt-4 border-t border-[#0A2A1B]/10 flex gap-3">
                                <button
                                    type="button"
                                    disabled={isUploading || amountMismatch}
                                    onClick={handleSubmitReceipt}
                                    className={`w-full py-3 text-white text-sm font-semibold rounded-full transition-all active:scale-[0.98] text-center flex items-center justify-center gap-2 ${
                                        amountMismatch
                                            ? 'bg-red-400 cursor-not-allowed opacity-80'
                                            : 'bg-[#D97706] hover:bg-[#0A2A1B] disabled:bg-gray-300 disabled:cursor-not-allowed'
                                    }`}
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Submitting Receipt...</span>
                                        </>
                                    ) : amountMismatch ? (
                                        <span>⚠ Amount Does Not Match — Fix Before Submitting</span>
                                    ) : (
                                        <span>Submit Proof of Payment</span>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
