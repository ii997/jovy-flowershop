export interface ExtractedReceiptDetails {
    amount: string;
    referenceNo: string;
    transactionDate: string;
}

export interface ReceiptOcrClassification {
    isReceipt: boolean;
    requiresManualReview: boolean;
}

const PAYMENT_LANGUAGE = /\b(?:payment|paid|transfer|sent|received|transaction|instapay|gcash|maya|bdo|bpi|unionbank|bank)\b/i;
const COMPLETION_STATUS = /\b(?:success(?:ful(?:ly)?)?|completed|credited|processed)\b/i;

export function classifyReceiptText(
    text: string,
    details: ExtractedReceiptDetails,
    confidence: number
): ReceiptOcrClassification {
    const hasPaymentSignal = PAYMENT_LANGUAGE.test(text) || COMPLETION_STATUS.test(text);
    const extractedDetails = [details.amount, details.referenceNo, details.transactionDate];
    const hasExtractedDetail = extractedDetails.some(value => value.trim().length > 0);
    const isReceipt = hasPaymentSignal && hasExtractedDetail;
    const allKeyDetailsExtracted = extractedDetails.every(value => value.trim().length > 0);

    return {
        isReceipt,
        requiresManualReview: isReceipt && (!allKeyDetailsExtracted || confidence < 70),
    };
}
