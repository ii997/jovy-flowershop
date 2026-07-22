import { CircularGallery, GalleryItem } from './ui/circular-gallery-2';

const galleryItems: GalleryItem[] = [
    { image: '/images/roses.png', text: 'Fresh Stems' },
    { image: '/images/orchids.png', text: 'Artisanal Styling' },
    { image: '/images/tulips.png', text: 'Same-day Delivery' },
    { image: '/images/sunflowers.png', text: 'Bespoke Design' },
    { image: '/images/wedding.png', text: 'Luxury Packaging' },
    { image: '/images/autumn.png', text: 'Seasonal Blooms' },
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
