import { CircularGallery, GalleryItem } from './ui/circular-gallery-2';

const galleryItems: GalleryItem[] = [
    { image: '/images/bouquet1.jpg', text: 'Crimson Romance' },
    { image: '/images/bouquet2.jpg', text: 'Blushing Pastels' },
    { image: '/images/boquet6.jpg', text: 'Golden Radiance' },
    { image: '/images/boquet4.jpg', text: 'Artisan Wrap' },
    { image: '/images/boquet5.jpg', text: 'Romantic Blooms' },
    { image: '/images/boquet10.jpg', text: 'Pastel Elegance' },
    { image: '/images/boquet8.jpg', text: 'Tropical Sunrise' },
    { image: '/images/boquet7.jpg', text: 'Lavender Serenity' },
    { image: '/images/boquet9.jpg', text: 'Daisy Dreams' },
    { image: '/images/bouquet3.jpg', text: 'Sweet Spring' },
];

export function Features() {
    return (
        <section id="why-us" className="bg-[#FAF9F6] py-20 border-y border-[#0A2A1B]/10 px-6">
            <div className="max-w-6xl mx-auto text-center space-y-12">
                <div className="max-w-xl mx-auto space-y-4">
                    <h2 className="font-serif text-3xl font-bold text-[#0A2A1B]">Gallery</h2>
                    <p className="text-[#0A2A1B]/75 text-sm">We design bouquets that capture the essence of nature's beauty and craftsmanship. Drag the carousel to browse our collections.</p>
                </div>

                {/* Circular Gallery container */}
                <div className="relative h-[480px] w-full bg-[#FAF9F6] rounded-3xl overflow-hidden flex items-center justify-center">
                    <CircularGallery
                        items={galleryItems}
                        bend={2.5}
                        borderRadius={0.06}
                        scrollEase={0.03}
                        scrollSpeed={1.5}
                        className="text-[#0A2A1B] font-serif"
                    />
                </div>
            </div>
        </section>
    );
}
