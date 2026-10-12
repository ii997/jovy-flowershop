import { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { classifyReceiptText } from '../receiptOcrValidation';

export function useReceiptOcr(isOpen: boolean) {
    const ocrRequestId = useRef(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [uploadError, setUploadError] = useState<string>('');
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

    // OCR states
    const [isOcrLoading, setIsOcrLoading] = useState<boolean>(false);
    const [ocrProgress, setOcrProgress] = useState<number>(0);
    const [isReceiptImage, setIsReceiptImage] = useState<boolean>(false);
    const [ocrReviewRequired, setOcrReviewRequired] = useState<boolean>(false);
    const [ocrConfidence, setOcrConfidence] = useState<number>(0);
    const [refNo, setRefNo] = useState<string>('');
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [txnDate, setTxnDate] = useState<string>('');

    const resetOcrState = () => {
        ocrRequestId.current += 1;
        setSelectedFile(null);
        setPreviewUrl('');
        setUploadError('');
        setIsUploading(false);
        setUploadSuccess(false);
        setRefNo('');
        setPaymentAmount('');
        setTxnDate('');
        setOcrProgress(0);
        setIsReceiptImage(false);
        setOcrReviewRequired(false);
        setOcrConfidence(0);
        setIsOcrLoading(false);
    };

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            resetOcrState();
        } else {
            ocrRequestId.current += 1;
        }
    }, [isOpen]);

    const runOcr = async (file: File) => {
        const requestId = ++ocrRequestId.current;
        setIsOcrLoading(true);
        setOcrProgress(0);
        setUploadError('');
        setIsReceiptImage(false);
        setOcrReviewRequired(false);
        setOcrConfidence(0);
        setRefNo('');
        setPaymentAmount('');
        setTxnDate('');

        try {
            const result = await Tesseract.recognize(
                file,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text' || m.status === 'loading tesseract core' || m.status === 'initializing api') {
                            setOcrProgress(Math.round((m.progress || 0) * 100));
                        }
                    }
                }
            );
            if (requestId !== ocrRequestId.current) return;

            const rawText = result.data.text || '';
            const confidence = result.data.confidence ?? 0;
            setOcrConfidence(confidence);

            // Clean & normalize OCR text
            const text = rawText
                .replace(/\r/g, '')
                .replace(/[₱\u20B1]/g, ' PHP ')
                .replace(/P\s*H\s*P/gi, ' PHP ');

            // --- 1. REFERENCE NUMBER EXTRACTION ---
            let foundRef = '';
            const refRegexes = [
                /\b(?:reference(?:\s*(?:id|no\.?|number))?|ref\.?(?:\s*(?:id|no\.?|number))?|txn\s*(?:id|no\.?|number)|transaction\s*(?:id|no\.?|number)|control\s*no\.?|trace\s*no\.?|seq\s*no\.?|auth(?:orization)?\s*code)\s*[:#=]?\s*([A-Z0-9][A-Z0-9 \t\-]{5,34})/im,
            ];

            for (const regex of refRegexes) {
                const match = text.match(regex);
                if (match && match[1]) {
                    const clean = match[1].trim().replace(/[^A-Z0-9]/gi, '');
                    if (clean.length >= 6 && clean.length <= 32) {
                        foundRef = clean;
                        break;
                    }
                }
            }

            if (!foundRef) {
                const prefixMatch = text.match(/(?:UBTXN|GCASH|MAYA|INP|BDO|BPI|GT|OR)[A-Z0-9]{6,25}/i);
                if (prefixMatch) {
                    foundRef = prefixMatch[0].toUpperCase();
                }
            }

            // --- 2. AMOUNT EXTRACTION ---
            let foundAmount = '';
            const amtRegexes = [
                /(?:amount(?:\s*(?:paid|sent|transferred|received|total))?|total\s*amount|paid)\s*[:=]?\s*(?:PHP\s*)?([\d,]+(?:\.\d{1,2})?)/i,
                /\bPHP\s*([\d,]+(?:\.\d{1,2})?)/i,
            ];

            for (const regex of amtRegexes) {
                const match = text.match(regex);
                if (match && match[1]) {
                    const clean = match[1].replace(/[^0-9.]/g, '');
                    const parsed = parseFloat(clean);
                    if (!isNaN(parsed) && parsed > 0) {
                        foundAmount = clean;
                        break;
                    }
                }
            }

            // --- 3. DATE EXTRACTION ---
            const dateRegex = /(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i;
            const dateMatch = text.match(dateRegex);
            const foundDate = dateMatch?.[0] || '';
            const classification = classifyReceiptText(
                text,
                {
                    amount: foundAmount,
                    referenceNo: foundRef,
                    transactionDate: foundDate,
                },
                confidence
            );

            if (!classification.isReceipt) {
                setUploadError('This image does not look like an online payment confirmation. Upload a clear screenshot showing payment or transfer details.');
                return;
            }

            setIsReceiptImage(true);
            setOcrReviewRequired(classification.requiresManualReview);
            setRefNo(foundRef);
            setPaymentAmount(confidence >= 70 ? foundAmount : '');
            setTxnDate(foundDate);
        } catch (err) {
            if (requestId !== ocrRequestId.current) return;
            console.error('OCR Parsing Error:', err);
            setUploadError('We could not verify that this image is a payment confirmation. Upload a clearer screenshot and try again.');
        } finally {
            if (requestId === ocrRequestId.current) {
                setIsOcrLoading(false);
            }
        }
    };

    const validateAndSetFile = (file: File) => {
        ocrRequestId.current += 1;
        setSelectedFile(null);
        setIsReceiptImage(false);
        setOcrReviewRequired(false);
        setOcrConfidence(0);
        setRefNo('');
        setPaymentAmount('');
        setTxnDate('');
        setIsOcrLoading(false);
        setOcrProgress(0);

        if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
            setUploadError('Only JPG, JPEG, and PNG images are accepted.');
            setPreviewUrl('');
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            setUploadError('Receipt image must be under 3 MB.');
            setPreviewUrl('');
            return;
        }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        runOcr(file);
    };

    return {
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
        isReceiptImage,
        ocrReviewRequired,
        ocrConfidence,
        refNo,
        setRefNo,
        paymentAmount,
        setPaymentAmount,
        txnDate,
        setTxnDate,
        validateAndSetFile,
        resetOcrState,
    };
}
