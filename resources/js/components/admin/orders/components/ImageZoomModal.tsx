interface ImageZoomModalProps {
    imageUrl: string | null;
    onClose: () => void;
}

export function ImageZoomModal({ imageUrl, onClose }: ImageZoomModalProps) {
    if (!imageUrl) return null;

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-zoom-out select-none"
        >
            <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center justify-center">
                <img 
                    src={imageUrl} 
                    alt="Receipt full expansion view" 
                    className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
                />
                <span className="text-white/60 text-[11px] font-bold mt-4 tracking-wider uppercase">Click anywhere to close full screen</span>
            </div>
        </div>
    );
}
