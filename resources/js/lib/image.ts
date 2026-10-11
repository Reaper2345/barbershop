/*
|--------------------------------------------------------------------------
| Local asset helpers
|--------------------------------------------------------------------------
| `masters.photo` stores a path relative to Laravel's `public` disk
| ("masters/ivan-sokolov.jpg"), never a URL. Everything that renders an image
| goes through here so the `/storage/...` prefix is applied in exactly one
| place — including uploaded files if a future prompt switches the disk to S3.
*/

const EXTERNAL_URL = /^(https?:)?\/\//i;

/**
 * Resolves a database image path to a browser URL.
 *
 * - absolute URLs are returned untouched,
 * - empty values fall back to `fallback`,
 * - a leading slash is respected (already-applied `/storage/` paths).
 */
export function storageUrl(
    path: string | null | undefined,
    fallback = '/images/placeholder-master.svg',
): string {
    if (!path) {
        return fallback;
    }

    if (EXTERNAL_URL.test(path) || path.startsWith('data:')) {
        return path;
    }

    if (path.startsWith('/')) {
        return path;
    }

    return `/storage/${path.replace(/^\/+/, '')}`;
}

/**
 * The 3 seeded barbers, used when a master row has no photo. Keyed by the
 * storage filename so the fallback stays stable across seeds.
 */
const MASTER_FALLBACKS: Record<string, string> = {
    'ivan-sokolov': '/images/masters/ivan-sokolov.svg',
    'artem-kuznetsov': '/images/masters/artem-kuznetsov.svg',
    'dmitry-volkov': '/images/masters/dmitry-volkov.svg',
};

/** Photo for a master card, falling back to the bundled placeholder. */
export function masterPhoto(
    photo: string | null | undefined,
    name?: string | null,
): string {
    const generic = '/images/placeholder-master.svg';

    if (!photo) {
        return fallbackForName(name) ?? generic;
    }

    if (EXTERNAL_URL.test(photo) || photo.startsWith('/') || photo.startsWith('data:')) {
        return photo;
    }

    const slug = Object.keys(MASTER_FALLBACKS).find((key) => photo.includes(key));

    // Uploaded photos live on the public disk; the SVG fallback only applies
    // when `onError` fires in <Img>, so return the storage URL here.
    return slug !== undefined
        ? storageUrl(photo, MASTER_FALLBACKS[slug])
        : storageUrl(photo, generic);
}

function fallbackForName(name?: string | null): string | null {
    if (!name) {
        return null;
    }

    const lowered = name.toLowerCase();

    const match = Object.entries(MASTER_FALLBACKS).find(([slug]) => {
        const [first] = slug.split('-');

        return lowered.includes(first);
    });

    return match?.[1] ?? null;
}

/**
 * Fallback used by <Img> when a real file is missing (the seeded `.jpg` files
 * are not committed, so this path is the common case in a fresh checkout).
 */
export function imageFallbackFor(src: string): string {
    const slug = Object.keys(MASTER_FALLBACKS).find((key) => src.includes(key));

    if (slug !== undefined) {
        return MASTER_FALLBACKS[slug];
    }

    if (src.includes('hero')) {
        return '/images/placeholder-hero.svg';
    }

    return '/images/placeholder-master.svg';
}

/*
 * ---------------------------------------------------------------------------
 * Portfolio
 * ---------------------------------------------------------------------------
 * Two kinds of photo live in `portfolio_items.photo_path`:
 *
 *   - bundled placeholders from the seeder: "portfolio/01.svg", shipped in
 *     public/images/portfolio/ so a fresh checkout renders without uploading,
 *   - real uploads: "portfolio/uploads/<name>.<ext>" on the `public` disk,
 *     served through /storage/... after `php artisan storage:link`.
 *
 * The prefix is what tells them apart — never the extension, because SVG is an
 * accepted upload type too.
 */

/** Placeholder used when an item somehow has no path at all. */
export const PORTFOLIO_FALLBACK = '/images/portfolio/01.svg';

export function portfolioPhoto(path: string | null | undefined): string {
    if (!path) {
        return PORTFOLIO_FALLBACK;
    }

    if (EXTERNAL_URL.test(path) || path.startsWith('data:') || path.startsWith('/')) {
        return path;
    }

    // Uploaded file on the public disk.
    if (path.startsWith('portfolio/uploads/')) {
        return `/storage/${path}`;
    }

    // Bundled placeholder inside public/images/.
    return `/images/${path.replace(/^\/+/, '')}`;
}
