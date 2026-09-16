import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image, InfoCircle, Check, Eye, AlertTriangle, ArrowRight, ShieldCheck } from 'reicon-react';
import { Order, PaymentTransaction } from '../types';
import { useAnimationTransition } from './animations';
import { useReceiptOcr } from '../lib/hooks/useReceiptOcr';
import { InstaPayQr } from './InstaPayQr';

interface PaymentResubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onResubmissionSuccess?: () => void;
}

export function PaymentResubmissionModal({
    isOpen,
    onClose,
    order,
    onResubmissionSuccess,
}: PaymentResubmissionModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [customQrImage, setCustomQrImage] = useState<string | null>(null);
    const [showPreviousReceiptZoom, setShowPreviousReceiptZoom] = useState(false);
    const [showQrHelper, setShowQrHelper] = useState(false);

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
        setRefNo,
        paymentAmount,
        txnDate,
        setTxnDate,
        validateAndSetFile,
    } = useReceiptOcr(order, isOpen);

    useEffect(() => {
        if (isOpen) {
            try {
                const savedQr = localStorage.getItem('store_settings_qr_image');
                setCustomQrImage(savedQr || null);
            } catch (e) {
                console.error('Failed to load custom QR image', e);
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

    const totalPrice = order
        ? (typeof order.total_price === 'number' ? order.total_price : parseFloat(order.total_price || '0'))
        : 0;

    const isReservation = order?.order_type === 'reservation';
    const downpaymentPct = isReservation ? parseInt(localStorage.getItem('store_settings_downpayment_pct') || '30') : 100;
    const expectedPaymentAmount = isReservation ? totalPrice * (downpaymentPct / 100.0) : totalPrice;

    // Security layer: detect amount mismatch between OCR-extracted value and expected payment total
    const parsedPaymentAmount = parseFloat(paymentAmount.replace(/,/g, '') || '0');
    const amountMismatch = paymentAmount !== '' && !isOcrLoading && Math.abs(parsedPaymentAmount - expectedPaymentAmount) > 0.01;

    // Find the latest rejected payment transaction audit note if available
    const latestTx: PaymentTransaction | undefined = order?.payment_transactions && order.payment_transactions.length > 0
        ? order.payment_transactions[order.payment_transactions.length - 1]
        : undefined;

    const rejectionReason = latestTx?.admin_notes || 'Payment proof verification failed or was incomplete. Please upload a clear and valid transaction screenshot.';
    const previousReceipt = latestTx?.receipt_image || order?.payment_receipt;
    const previousRefNo = latestTx?.reference_no || order?.payment_details?.reference_no;

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
                if (onResubmissionSuccess) {
                    setTimeout(() => {
                        onResubmissionSuccess();
                    }, 1200);
                }
            } else {
                const data = await res.json().catch(() => null);
                setUploadError(data?.message || 'Failed to resubmit payment receipt.');
            }
        } catch {
            setUploadError('Connection error. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const transition = useAnimationTransition('elegant');

    return (
        <AnimatePresence>
            {isOpen && order && (
                <div className="fixed inset-0 z-60 overflow-y-auto flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <motion.div
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-[#0A2A1B]/60 backdrop-blur-sm"
                    />

                    {/* Modal Body */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={transition}
                        className="relative bg-[#FAF9F6] border border-[#0A2A1B]/15 rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl z-10 my-8 space-y-6 max-h-[92vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start pb-4 border-b border-[#0A2A1B]/10">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                                        Payment Verification Needed
                                    </span>
                                    <span className="text-xs font-mono font-bold text-[#0A2A1B]/60">
                                        #JFS-{order.id}
                                    </span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-[#0A2A1B] font-serif mt-1">
                                    Resubmit Proof of Payment
                                </h3>
                                <p className="text-xs text-[#0A2A1B]/60 mt-0.5">
                                    Review the auditor feedback below and upload your updated payment proof.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-[#0A2A1B]/5 text-[#0A2A1B]/60 hover:text-[#0A2A1B] cursor-pointer transition-all active:scale-90"
                                aria-label="Close resubmission dialog"
                            >
                                <X className="h-5 w-5" strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* Side-by-Side Comparison Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            
                            {/* Left Column: Rejection Audit & Previous Submission */}
                            <div className="space-y-4">
                                {/* Admin Feedback Card */}
                                <div className="p-4.5 rounded-2xl bg-rose-50/90 border-2 border-rose-200/90 shadow-xs space-y-2">
                                    <div className="flex items-center gap-2 text-rose-900">
                                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                                        <h4 className="text-xs font-bold uppercase tracking-wider">
                                            Store Feedback / Reason for Rejection
                                        </h4>
                                    </div>
                                    <p className="text-xs font-medium text-rose-950 bg-white/80 p-3 rounded-xl border border-rose-200/60 leading-relaxed select-text">
                                        "{rejectionReason}"
                                    </p>
                                    <span className="text-[10px] text-rose-700/80 block">
                                        Please ensure your replacement screenshot clearly displays the reference number, recipient name, and exact amount.
                                    </span>
                                </div>

                                {/* Order & Previous Payment Snapshot */}
                                <div className="p-4.5 rounded-2xl bg-white border border-[#0A2A1B]/10 space-y-3.5 shadow-2xs">
                                    <h4 className="text-[10px] font-bold text-[#0A2A1B]/50 uppercase tracking-wider border-b border-[#0A2A1B]/10 pb-2 flex justify-between items-center">
                                        <span>Previous Submission Details</span>
                                        <span className="text-rose-700 font-mono font-bold">Status: Failed</span>
                                    </h4>

                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-[#0A2A1B]/60">Required Payment</span>
                                            <span className="font-extrabold text-[#0A2A1B]">
                                                ₱{expectedPaymentAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                {isReservation && (
                                                    <span className="text-[10px] text-[#D97706] font-semibold ml-1">({downpaymentPct}% DP)</span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#0A2A1B]/60">Previous Ref #</span>
                                            <span className="font-mono font-bold text-[#0A2A1B] bg-gray-50 px-2 py-0.5 rounded border border-gray-200 select-all">
                                                {previousRefNo || 'None recorded'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Previous Receipt Thumbnail */}
                                    {previousReceipt ? (
                                        <div className="space-y-2 pt-2 border-t border-[#0A2A1B]/10">
                                            <span className="text-[10px] font-bold uppercase text-[#0A2A1B]/50 block">
                                                Rejected Receipt Screenshot
                                            </span>
                                            <div 
                                                onClick={() => setShowPreviousReceiptZoom(true)}
                                                className="relative group rounded-xl overflow-hidden border border-rose-200 bg-black/5 p-1.5 flex items-center justify-center cursor-pointer hover:border-rose-400 transition-all max-h-40"
                                            >
                                                <img 
                                                    src={previousReceipt} 
                                                    alt="Previous Rejected Receipt" 
                                                    className="max-h-36 object-contain rounded-lg transition-transform group-hover:scale-102 opacity-85 group-hover:opacity-100" 
                                                />
                                                <div className="absolute inset-0 bg-[#0A2A1B]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity gap-1 rounded-xl">
                                                    <Eye className="h-4 w-4" />
                                                    <span>Click to Zoom</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-gray-50 rounded-xl text-center text-xs text-gray-500 italic">
                                            No previous receipt image was recorded.
                                        </div>
                                    )}
                                </div>

                                {/* QR Code helper toggle */}
                                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                            <span>📱 Need the Store Payment QR?</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowQrHelper(!showQrHelper)}
                                            className="text-[11px] font-bold text-[#D97706] hover:text-[#B45309] underline cursor-pointer"
                                        >
                                            {showQrHelper ? 'Hide QR Code' : 'Show QR Code'}
                                        </button>
                                    </div>
                                    {showQrHelper && (
                                        <div className="pt-2 border-t border-amber-200/60 flex flex-col items-center">
                                            <InstaPayQr totalPrice={expectedPaymentAmount} customQrImage={customQrImage} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: New Receipt Upload & Correction */}
                            <div className="space-y-4">
                                <div className="p-4.5 rounded-2xl bg-white border border-[#0A2A1B]/10 space-y-4 shadow-2xs">
                                    <div className="flex items-center justify-between border-b border-[#0A2A1B]/10 pb-2">
                                        <h4 className="text-[10px] font-bold text-[#0A2A1B]/50 uppercase tracking-wider flex items-center gap-1.5">
                                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                            Upload New / Corrected Proof
                                        </h4>
                                        <span className="text-[10px] text-[#0A2A1B]/50 font-medium">Step 2 of 2</span>
                                    </div>

                                    {uploadSuccess ? (
                                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-6 rounded-2xl text-center space-y-2.5">
                                            <Check className="h-8 w-8 mx-auto text-emerald-600" strokeWidth={2.5} />
                                            <h4 className="font-bold text-base">Payment Proof Resubmitted!</h4>
                                            <p className="text-xs text-emerald-800 leading-relaxed">
                                                Thank you! Your corrected payment receipt has been sent to the store. We will re-verify your order promptly.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Drag and Drop Zone */}
                                            <div
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={handleDrop}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-[#0A2A1B]/15 hover:border-[#D97706]/50 hover:bg-[#D97706]/[0.02] p-5 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-[#FAF9F6]/50"
                                            >
                                                {previewUrl ? (
                                                    <div className="relative w-full max-h-48 overflow-hidden rounded-xl border border-gray-200 flex items-center justify-center bg-white p-2">
                                                        <img src={previewUrl} alt="New receipt preview" className="w-full h-full object-contain max-h-44" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 rounded-full bg-[#0A2A1B]/5 flex items-center justify-center text-[#0A2A1B]/40">
                                                            <Image className="h-6 w-6" strokeWidth={1.5} />
                                                        </div>
                                                        <span className="text-xs text-center text-[#0A2A1B]/70 font-semibold">
                                                            Drag & drop new receipt screenshot or <span className="text-[#D97706] font-bold">browse</span>
                                                        </span>
                                                        <span className="text-[10px] text-[#0A2A1B]/40">JPG, PNG · Max 3 MB</span>
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

                                            {/* OCR Scanning Progress */}
                                            {isOcrLoading && (
                                                <div className="bg-[#D97706]/5 border border-[#D97706]/15 p-4 rounded-2xl flex flex-col gap-2">
                                                    <div className="flex justify-between items-center text-[10px] font-bold text-[#D97706] uppercase tracking-wider">
                                                        <span>Scanning receipt with OCR...</span>
                                                        <span>{ocrProgress}%</span>
                                                    </div>
                                                    <div className="w-full bg-[#D97706]/10 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-[#D97706] h-full transition-all duration-300"
                                                            style={{ width: `${ocrProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Verified OCR Fields */}
                                            {selectedFile && !isOcrLoading && (
                                                <div className="bg-[#FAF9F6] border border-[#0A2A1B]/10 p-4 rounded-2xl space-y-3">
                                                    <span className="text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider block">
                                                        ✿ Transaction Details Extracted
                                                    </span>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                        <div className="flex flex-col gap-1">
                                                            <label className="text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider">
                                                                Reference ID #
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={refNo}
                                                                onChange={(e) => setRefNo(e.target.value)}
                                                                className="px-3 py-2 border border-[#0A2A1B]/20 bg-white text-[#0A2A1B] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                                                                placeholder="e.g. 1029384756"
                                                            />
                                                        </div>

                                                        <div className="flex flex-col gap-1">
                                                            <label className={`text-[10px] font-bold uppercase tracking-wider ${amountMismatch ? 'text-red-600' : 'text-[#0A2A1B]/60'}`}>
                                                                Amount (₱)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={paymentAmount}
                                                                readOnly
                                                                className={`px-3 py-2 border-2 font-semibold rounded-xl focus:outline-none transition-colors bg-gray-50 text-[#0A2A1B]/70 cursor-not-allowed ${
                                                                    amountMismatch
                                                                        ? 'border-red-500 text-red-700 bg-red-50/50'
                                                                        : 'border-[#0A2A1B]/20'
                                                                }`}
                                                                placeholder="Amount on receipt"
                                                            />
                                                            {amountMismatch && (
                                                                <div className="flex items-start gap-1.5 mt-1 px-1">
                                                                    <InfoCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" strokeWidth={2} />
                                                                    <span className="text-[10px] text-red-600 font-semibold leading-tight">
                                                                        Mismatch — receipt shows ₱{parsedPaymentAmount.toFixed(2)}, expected ₱{expectedPaymentAmount.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col gap-1 sm:col-span-2">
                                                            <label className="text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider">
                                                                Transaction Date
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={txnDate}
                                                                onChange={(e) => setTxnDate(e.target.value)}
                                                                className="px-3 py-2 border border-[#0A2A1B]/20 bg-white text-[#0A2A1B] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                                                                placeholder="Date & Time"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {uploadError && (
                                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                                                    <InfoCircle className="h-4 w-4 shrink-0" />
                                                    <span>{uploadError}</span>
                                                </div>
                                            )}

                                            {/* Submit Button */}
                                            {selectedFile && !isOcrLoading && (
                                                <div className="pt-2">
                                                    <button
                                                        type="button"
                                                        disabled={isUploading || amountMismatch}
                                                        onClick={handleSubmitReceipt}
                                                        className={`w-full py-3 text-white text-xs font-bold rounded-full transition-all active:scale-[0.98] text-center flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                                                            amountMismatch
                                                                ? 'bg-red-400 cursor-not-allowed opacity-80'
                                                                : 'bg-[#D97706] hover:bg-[#0A2A1B] disabled:bg-gray-300 disabled:cursor-not-allowed'
                                                        }`}
                                                    >
                                                        {isUploading ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                <span>Resubmitting Payment Proof...</span>
                                                            </>
                                                        ) : amountMismatch ? (
                                                            <span>⚠ Amount Does Not Match Required Total</span>
                                                        ) : (
                                                            <>
                                                                <span>Resubmit Corrected Payment Proof</span>
                                                                <ArrowRight className="h-4 w-4" />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Lightbox for Previous Rejected Receipt */}
                    {showPreviousReceiptZoom && previousReceipt && (
                        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" role="dialog" aria-modal="true">
                            <div className="relative bg-white max-w-md w-full rounded-3xl p-5 shadow-2xl border border-white/20 flex flex-col space-y-3">
                                <div className="flex items-center justify-between border-b border-[#0A2A1B]/10 pb-2">
                                    <h4 className="font-bold text-sm text-[#0A2A1B]">Previous Rejected Receipt</h4>
                                    <button
                                        type="button"
                                        onClick={() => setShowPreviousReceiptZoom(false)}
                                        className="p-1 rounded-full hover:bg-gray-100 text-[#0A2A1B]/60 hover:text-[#0A2A1B] cursor-pointer"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="overflow-auto rounded-xl border border-[#0A2A1B]/10 bg-black/5 flex items-center justify-center p-2">
                                    <img src={previousReceipt} alt="Previous Proof" className="max-h-[60vh] object-contain rounded-lg" />
                                </div>
                                <div className="flex justify-end pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowPreviousReceiptZoom(false)}
                                        className="px-4 py-1.5 bg-[#0A2A1B] text-white text-xs font-bold rounded-xl cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AnimatePresence>
    );
}

export default PaymentResubmissionModal;
