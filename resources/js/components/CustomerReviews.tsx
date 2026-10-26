import { useEffect, useState } from 'react';
import { Star } from 'reicon-react';

interface CustomerReview {
    id: number;
    rating: number;
    comment?: string | null;
    reviewer_name: string;
    published_at: string;
}

export function CustomerReviews() {
    const [reviews, setReviews] = useState<CustomerReview[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);

    useEffect(() => {
        fetch('/api/reviews', { headers: { Accept: 'application/json' } })
            .then((response) => response.ok ? response.json() : [])
            .then((data) => {
                setReviews((data.reviews ?? []).slice(0, 10));
                setAverageRating(Number(data.average_rating ?? 0));
                setReviewCount(Number(data.review_count ?? 0));
            })
            .catch(() => setReviews([]));
    }, []);

    if (reviews.length === 0) {
        return null;
    }

    return (
        <section className="px-6 md:px-12 py-16 bg-white border-y border-[#0A2A1B]/5" aria-labelledby="customer-reviews-title">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#D97706]">From our customers</span>
                    <h2 id="customer-reviews-title" className="font-serif text-3xl md:text-4xl font-bold text-[#0A2A1B] mt-2">Kind words, freshly shared</h2>
                    <div className="flex items-center justify-center gap-2 mt-4 text-sm text-[#0A2A1B]/65">
                        <span className="flex gap-0.5 text-[#D97706]" aria-label={`${averageRating} out of 5 stars`}>
                            {Array.from({ length: 5 }, (_, index) => (
                                <Star key={index} className="h-4 w-4" weight={index < Math.round(averageRating) ? 'Filled' : 'Regular'} aria-hidden={true} />
                            ))}
                        </span>
                        <strong className="text-[#0A2A1B]">{averageRating.toFixed(1)} / 5</strong>
                        <span>from {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {reviews.map((review) => (
                        <article key={review.id} className="rounded-2xl border border-[#0A2A1B]/10 bg-[#FAF9F6] p-5">
                            <div className="flex gap-1 text-[#D97706]" aria-label={`${review.rating} out of 5 stars`}>
                                {Array.from({ length: 5 }, (_, index) => (
                                    <Star key={index} className="h-4 w-4" weight={index < review.rating ? 'Filled' : 'Regular'} aria-hidden={true} />
                                ))}
                            </div>
                            {review.comment && <p className="text-sm leading-relaxed text-[#0A2A1B]/75 mt-4">“{review.comment}”</p>}
                            <p className="text-xs font-bold text-[#0A2A1B] mt-5">{review.reviewer_name}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
