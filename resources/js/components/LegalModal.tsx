import { motion, AnimatePresence } from 'motion/react';
import { useAnimationTransition } from './animations';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'terms' | 'privacy';
}

function TermsContent() {
    return (
        <div className="space-y-5 text-xs leading-relaxed text-[#0A2A1B]/80">
            <div className="bg-[#FAF9F6] -mx-6 -mt-6 px-6 py-5 border-b border-[#0A2A1B]/5">
                <h3 className="font-serif text-xl font-bold text-[#0A2A1B]">Terms &amp; Conditions</h3>
                <p className="text-[10px] text-[#0A2A1B]/50 mt-1">Last updated: July 26, 2026</p>
            </div>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">1. Acceptance of Terms</h4>
                <p>
                    By accessing or using Jovy's Flowershop website and services, you agree to be bound by these
                    Terms and Conditions. If you do not agree with any part of these terms, you must not use our
                    website or place an order.
                </p>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">2. Definitions</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>"Jovy's Flowershop"</strong>, <strong>"we"</strong>, <strong>"us"</strong>, or <strong>"our"</strong> refers to the flower shop owned and operated under the business name Jovy's Flowershop, based in Kidapawan City, Cotabato, Philippines.</li>
                    <li><strong>"Customer"</strong>, <strong>"you"</strong>, or <strong>"your"</strong> refers to the individual placing an order or using this website.</li>
                    <li><strong>"Order"</strong> refers to a request for products made through our website.</li>
                    <li><strong>"Pickup"</strong> refers to the in-store collection method used for all orders — delivery is not available.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">3. Account Registration</h4>
                <p>
                    To place an order, you must register for an account and provide accurate, current, and complete
                    information. You are responsible for maintaining the confidentiality of your account credentials
                    and for all activities that occur under your account. You must notify us immediately of any
                    unauthorized use of your account.
                </p>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">4. Orders &amp; Acceptance</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li>All orders placed through our website are subject to acceptance and availability.</li>
                    <li>We reserve the right to refuse or cancel any order for reasons including but not limited to: product unavailability, pricing errors, or suspected fraudulent activity.</li>
                    <li>Once an order is placed, you will receive a confirmation with an order reference number (#JFS-{'{id}'}). This confirms we have received your order but does not constitute acceptance until payment has been verified.</li>
                    <li>We reserve the right to limit quantities per customer per order.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">5. Pricing &amp; Payment</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li>All prices are quoted in Philippine Peso (₱) and are inclusive of applicable taxes unless stated otherwise.</li>
                    <li>Prices are subject to change without prior notice. However, the price applied to your order will be the price displayed at the time of purchase.</li>
                    <li>For <strong>purchase orders</strong>, full payment is required before the order is processed for preparation.</li>
                    <li>For <strong>reservation orders</strong>, a downpayment (default 30% of the total price) is required to secure the reservation. The remaining balance is payable upon pickup.</li>
                    <li>Payment is accepted via InstaPay bank transfer. Proof of payment (screenshot of the transaction) must be uploaded through our website for verification.</li>
                    <li>All payments are processed through third-party payment gateways. We do not store full banking details or credit card information on our servers.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">6. Pickup Policy</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li>All orders are <strong>pickup-only</strong> from our store location at Kidapawan City, Cotabato. We do not offer delivery services.</li>
                    <li>Orders must be picked up on the specified pickup date during our operating hours (Daily: 5:00 AM – 8:00 PM).</li>
                    <li>Please bring your order confirmation (reference number) when picking up your order.</li>
                    <li>If you are unable to pick up on the scheduled date, please contact us at least 24 hours in advance to reschedule.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">7. Cancellation &amp; Refunds</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Orders that are still in <strong>"confirmed"</strong> status (not yet being prepared) may be cancelled by the customer through their account profile.</li>
                    <li>Orders that have already moved to <strong>"preparing"</strong> or <strong>"delivered"</strong> status cannot be cancelled by the customer.</li>
                    <li>For cancelled orders with verified payment, a refund will be processed using the original payment method. Refund processing may take 3–7 business days.</li>
                    <li>We reserve the right to cancel any order at our discretion. In such cases, a full refund will be issued.</li>
                    <li>Refunds for reservation downpayments follow the same process as purchase refunds.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">8. Product Descriptions &amp; Availability</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li>We strive to display our products as accurately as possible. However, due to the handcrafted nature of floral arrangements, actual products may vary slightly from the images shown.</li>
                    <li>Flower availability is subject to seasonal variations and market supply. If a specific flower used in a product is unavailable, we reserve the right to substitute it with a flower of equal or greater value while maintaining the overall design aesthetic.</li>
                    <li>We reserve the right to discontinue any product at any time.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">9. Limitation of Liability</h4>
                <p>
                    To the fullest extent permitted by applicable law, Jovy's Flowershop shall not be liable for any
                    indirect, incidental, special, consequential, or punitive damages arising out of or related to
                    your use of our website or products. Our total liability for any claim arising from your order
                    shall not exceed the total amount paid for that order.
                </p>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">10. Intellectual Property</h4>
                <p>
                    All content on this website — including text, graphics, logos, images, floral arrangement
                    designs, and software — is the property of Jovy's Flowershop and is protected by Philippine
                    intellectual property laws. You may not reproduce, distribute, modify, or commercially exploit
                    any content without our prior written consent.
                </p>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">11. User Conduct</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li>You agree not to use the website for any unlawful purpose or in violation of these terms.</li>
                    <li>You agree not to attempt to gain unauthorized access to any part of the website, accounts, or systems.</li>
                    <li>You agree not to interfere with the proper functioning of the website, including introducing viruses or malicious code.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">12. Governing Law &amp; Dispute Resolution</h4>
                <p>
                    These Terms and Conditions shall be governed by and construed in accordance with the laws of
                    the Republic of the Philippines. Any disputes arising from these terms or your use of our
                    services shall be subject to the exclusive jurisdiction of the courts of Kidapawan City,
                    Cotabato, Philippines.
                </p>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">13. Modifications to Terms</h4>
                <p>
                    We reserve the right to modify these Terms and Conditions at any time. Changes will take
                    effect immediately upon posting on our website. Your continued use of the website after any
                    modifications constitutes your acceptance of the updated terms. We encourage you to review
                    this page periodically.
                </p>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">14. Contact Information</h4>
                <p>
                    For any questions, concerns, or requests regarding these Terms and Conditions, you may contact us at:
                </p>
                <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#0A2A1B]/5 space-y-1">
                    <p><strong>Jovy's Flowershop</strong></p>
                    <p>Kidapawan City, Cotabato, Philippines</p>
                    <p>Email: velasrubiojovy@outlook.com</p>
                    <p>Phone: +63 909 785 0776</p>
                </div>
            </section>
        </div>
    );
}

function PrivacyContent() {
    return (
        <div className="space-y-5 text-xs leading-relaxed text-[#0A2A1B]/80">
            <div className="bg-[#FAF9F6] -mx-6 -mt-6 px-6 py-5 border-b border-[#0A2A1B]/5">
                <h3 className="font-serif text-xl font-bold text-[#0A2A1B]">Privacy Policy</h3>
                <p className="text-[10px] text-[#0A2A1B]/50 mt-1">Last updated: July 26, 2026</p>
            </div>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">1. Our Commitment to Your Privacy</h4>
                <p>
                    Jovy's Flowershop respects your privacy and is committed to protecting your personal data
                    in compliance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> of the
                    Philippines and its Implementing Rules and Regulations. This Privacy Policy explains how we
                    collect, use, disclose, store, and safeguard your information when you visit our website and
                    use our services.
                </p>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">2. Information We Collect</h4>
                <p className="font-semibold text-[#0A2A1B]">Personal Information You Provide:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Account Information:</strong> Full name, email address, and password (stored as a salted hash) when you register an account.</li>
                    <li><strong>Order Information:</strong> Recipient name, recipient phone number, pickup date, gift message, and order history.</li>
                    <li><strong>Payment Information:</strong> Payment transaction reference numbers, amounts, and uploaded receipt images. We do <strong>not</strong> store full bank account numbers, credit card numbers, or banking credentials on our servers — payment data is processed through third-party payment gateways.</li>
                    <li><strong>Profile Information:</strong> Your account name, email address, and any profile updates you make.</li>
                    <li><strong>Communications:</strong> Any messages, inquiries, or feedback you send to us.</li>
                </ul>
                <p className="font-semibold text-[#0A2A1B] mt-3">Information Collected Automatically:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Device &amp; Usage Data:</strong> IP address, browser type, operating system, referring URLs, pages visited, and the date/time of your visit.</li>
                    <li><strong>Cookies &amp; Similar Technologies:</strong> We use essential session cookies to maintain your login state and shopping experience. Analytics cookies help us understand how our site is used to improve your experience.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">3. How We Use Your Information</h4>
                <p>We use the collected information for the following purposes:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Order Processing &amp; Fulfillment:</strong> To process your orders, confirm payments, notify you about order status updates, and coordinate pickup arrangements.</li>
                    <li><strong>Account Management:</strong> To create and maintain your account, verify your identity, and provide customer support.</li>
                    <li><strong>Payment Verification:</strong> To verify payment receipts and process refunds when applicable.</li>
                    <li><strong>Notifications:</strong> To send you order confirmations, status updates, payment alerts, and administrative messages. These are transactional and essential to your use of our service.</li>
                    <li><strong>Improvement &amp; Analytics:</strong> To analyze usage patterns, diagnose technical issues, and improve our website and services.</li>
                    <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
                </ul>
                <p className="mt-2">
                    We do <strong>not</strong> use your personal data for marketing purposes or share it with
                    third parties for their own marketing without your explicit consent.
                </p>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">4. Data Security &amp; Encryption</h4>
                <p>
                    Protecting your personal data is a priority. We have implemented appropriate technical,
                    organizational, and physical security measures to safeguard your information against
                    unauthorized access, alteration, disclosure, or destruction:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        <strong>Encryption in Transit:</strong> Our website is served exclusively over HTTPS
                        using TLS (Transport Layer Security) encryption. All data transmitted between your
                        browser and our servers is encrypted using industry-standard 256-bit TLS protocols,
                        ensuring that your personal information cannot be intercepted during transmission.
                    </li>
                    <li>
                        <strong>Encryption at Rest:</strong> Sensitive data stored on our servers, including
                        personal information and order details, is protected at rest. Passwords are hashed
                        using bcrypt or Argon2id — industry-standard one-way hashing algorithms — and are never
                        stored in plain text or reversible form.
                    </li>
                    <li>
                        <strong>Secure Payment Processing:</strong> Payment transaction data is handled
                        through secured third-party payment gateways. We do not store full banking details,
                        credit card numbers, or CVV codes on our infrastructure. Payment receipt images are
                        stored in encrypted storage.
                    </li>
                    <li>
                        <strong>Access Controls:</strong> Access to personal data is restricted to authorized
                        personnel only, on a need-to-know basis. Administrative accounts are protected by
                        strong password policies and session management.
                    </li>
                    <li>
                        <strong>Server Security:</strong> Our servers are configured with security best
                        practices including regular security updates, firewall protections, and monitoring
                        for unauthorized access attempts.
                    </li>
                    <li>
                        <strong>Session Security:</strong> User sessions are secured with encrypted session
                        cookies and automatic session expiration. CSRF (Cross-Site Request Forgery) protection
                        is enforced on all state-changing operations.
                    </li>
                </ul>
                <p className="mt-2 text-[#0A2A1B]/60 italic">
                    While we implement strong security measures, no method of electronic transmission or
                    storage is 100% secure. We cannot guarantee absolute security but will promptly notify
                    affected users and the National Privacy Commission in the event of a data breach as
                    required by the Data Privacy Act.
                </p>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">5. Data Retention</h4>
                <p>
                    We retain your personal data only as long as necessary to fulfill the purposes for which
                    it was collected, including for legal, accounting, or reporting requirements:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Account data:</strong> Retained for the duration of your account's existence and for a reasonable period after account closure to comply with legal obligations.</li>
                    <li><strong>Order records:</strong> Retained for at least five (5) years as required by Philippine tax and accounting regulations (National Internal Revenue Code).</li>
                    <li><strong>Payment records:</strong> Retained for at least five (5) years for audit and compliance purposes.</li>
                    <li><strong>Communications:</strong> Retained for two (2) years from the date of the last interaction.</li>
                </ul>
                <p>
                    After the retention period expires, data is securely deleted or anonymized for analytical purposes.
                </p>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">6. Data Sharing &amp; Third Parties</h4>
                <p>
                    We do not sell, trade, or rent your personal data to third parties. We may share your
                    information only in the following circumstances:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Payment Processors:</strong> We share necessary transaction data with our third-party payment gateways to process payments. These processors have their own privacy policies governing data handling.</li>
                    <li><strong>Legal Obligations:</strong> We may disclose information if required by law, court order, or government regulation, or to protect our rights, property, or safety.</li>
                    <li><strong>Service Providers:</strong> We may engage trusted third-party service providers (e.g., hosting services, SMS notification providers) who access data only to perform services on our behalf and are contractually bound to maintain confidentiality.</li>
                    <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity with notice to you.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">7. Your Rights Under the Data Privacy Act</h4>
                <p>
                    Under the Philippine Data Privacy Act of 2012 (RA 10173), you have the following rights
                    regarding your personal data:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Right to be Informed:</strong> To know what personal data is being collected, how it is used, and with whom it is shared (as described in this policy).</li>
                    <li><strong>Right to Access:</strong> To request a copy of the personal data we hold about you.</li>
                    <li><strong>Right to Rectification:</strong> To request correction of inaccurate or incomplete data.</li>
                    <li><strong>Right to Erasure or Blocking:</strong> To request deletion or blocking of your personal data when its retention is no longer necessary for lawful purposes.</li>
                    <li><strong>Right to Object:</strong> To object to the processing of your personal data, including for direct marketing purposes.</li>
                    <li><strong>Right to Data Portability:</strong> To receive your data in a structured, commonly used, and machine-readable format.</li>
                    <li><strong>Right to Withdraw Consent:</strong> To withdraw your consent to data processing at any time, without affecting the lawfulness of processing based on consent before its withdrawal.</li>
                    <li><strong>Right to Damages:</strong> To claim compensation for damages sustained due to inaccurate, incomplete, outdated, or unlawfully obtained personal data or due to unauthorized use of such data.</li>
                </ul>
                <p className="mt-2">
                    To exercise any of these rights, please contact us using the information in Section 11.
                    We will respond to your request within the timeframes required by law.
                </p>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">8. Cookies &amp; Tracking Technologies</h4>
                <p>
                    Our website uses cookies and similar tracking technologies to enhance your browsing experience:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Essential/Strictly Necessary Cookies:</strong> Required for the website to function properly, including session management and CSRF protection. These do not require consent.</li>
                    <li><strong>Functional Cookies:</strong> Remember your preferences and login state to provide a personalized experience.</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website so we can improve performance and usability. These collect anonymized aggregate data.</li>
                </ul>
                <p>
                    You can control cookie preferences through your browser settings. Disabling certain cookies
                    may affect the functionality of our website.
                </p>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">9. Data Breach Notification</h4>
                <p>
                    In the event of a data breach involving sensitive personal information, we will:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Notify the <strong>National Privacy Commission (NPC)</strong> within 72 hours of becoming aware of the breach, as required by NPC Circular 2023-06.</li>
                    <li>Notify affected data subjects if the breach poses a real risk of harm to their rights and freedoms.</li>
                    <li>Take immediate remedial action to contain the breach and prevent further compromise.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">10. Children's Privacy</h4>
                <p>
                    Our services are not directed to individuals under the age of 18. We do not knowingly collect
                    personal data from minors. If you are a parent or guardian and believe your child has provided
                    us with personal information, please contact us so we can delete the data.
                </p>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">11. Contact Us &amp; Data Protection Officer</h4>
                <p>
                    If you have any questions, concerns, or requests regarding this Privacy Policy or the
                    handling of your personal data, please contact our Data Protection Officer (DPO):
                </p>
                <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#0A2A1B]/5 space-y-1">
                    <p><strong>Jovy's Flowershop — Data Protection Officer</strong></p>
                    <p>Kidapawan City, Cotabato, Philippines</p>
                    <p>Email: velasrubiojovy@outlook.com</p>
                    <p>Phone: +63 909 785 0776</p>
                </div>
                <p className="mt-2">
                    You also have the right to file a complaint with the <strong>National Privacy Commission</strong>
                    at <span className="text-[#D97706]">privacy.gov.ph</span> if you believe your data privacy rights
                    have been violated.
                </p>
            </section>

            <section className="space-y-2">
                <h4 className="font-bold text-[#0A2A1B] text-xs">12. Changes to This Policy</h4>
                <p>
                    We may update this Privacy Policy from time to time. Changes will be posted on this page
                    with an updated "Last updated" date. We encourage you to review this policy periodically.
                    Material changes will be communicated through our website or via email.
                </p>
            </section>
        </div>
    );
}

export function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
    const transition = useAnimationTransition('elegant');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden" role="dialog" aria-modal="true"
                    aria-label={type === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}>
                    {/* Backdrop */}
                    <motion.div
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-[#0A2A1B]/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={transition}
                        className="relative bg-white max-w-2xl w-full mx-4 rounded-3xl shadow-2xl border border-[#0A2A1B]/10 z-10 flex flex-col max-h-[85vh]"
                    >
                        {/* Scrollable Content */}
                        <div className="overflow-y-auto p-6 flex-1">
                            {type === 'terms' ? <TermsContent /> : <PrivacyContent />}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-[#0A2A1B]/5 px-6 py-4 flex justify-end bg-[#FAF9F6] rounded-b-3xl">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-[#0A2A1B] hover:bg-[#D97706] text-white text-xs font-bold rounded-full transition-all cursor-pointer active:scale-95"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
