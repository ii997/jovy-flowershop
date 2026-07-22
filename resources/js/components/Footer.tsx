export function Footer() {
    return (
        <footer id="footer" className="bg-[#0A2A1B] text-white/70 py-16 px-6 text-sm">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white">
                        <svg className="h-6 w-6 text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                            <path d="M12 4C12 4 8 7 8 10C8 12.5 10 14 12 14C14 14 16 12.5 16 10C16 7 12 4 12 4Z" />
                            <path d="M12 14C12 14 9 16 9 18.5C9 20.5 10.5 22 12 22C13.5 22 15 20.5 15 18.5C15 16 12 14 12 14Z" />
                            <path d="M10 8H14" /><path d="M12 6V10" />
                        </svg>
                        <span className="font-serif text-lg font-bold tracking-wide uppercase">Jovy's Flowershop</span>
                    </div>
                    <p className="text-xs leading-relaxed text-white/60">
                        Creating moments into beautiful memories with bespoke artisanal arrangements crafted fresh daily.
                    </p>
                </div>

                <div>
                    <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-xs">Store Hours</h4>
                    <ul className="space-y-2 text-xs text-white/60">
                        <li>Daily: 5:00 AM – 8:00 PM</li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-xs">Visit Us</h4>
                    <p className="text-xs leading-relaxed text-white/60">
                        Kidapawan City<br />
                        Cotabato (North), Philippines<br />
                        velasrubiojovy@outlook.com
                    </p>
                </div>
            </div>
            <div className="max-w-6xl mx-auto border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs gap-4 text-white/40">
                <p>&copy; {new Date().getFullYear()} Jovy's Flowershop. All rights reserved.</p>
                <div className="flex gap-6">
                    <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}
