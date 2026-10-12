import { useEffect, useRef, useState } from 'react';
import { MapPinIcon } from '@/lib/icons';

/*
|--------------------------------------------------------------------------
| VenueMap
|--------------------------------------------------------------------------
| Venue map for the contacts block (home page and the CMS contacts page).
|
| PRIMARY — Yandex Maps JS API v3, loaded from api-maps.yandex.ru with the key
| stored in the `yandex_maps_api_key` setting (paste it in /admin/settings). The
| The API key is only used to build the script URL; the map itself is drawn from
| settings.map_lat / settings.map_lng with a custom marker element.
|
|   Scroll behaviour: v3 does not zoom on the wheel unless 'scrollZoom' is in
|   the behaviour list, so we leave it out and add our own NON-PASSIVE wheel
|   listener. Plain wheel → the event is not touched and bubbles, so the PAGE
|   scrolls. Ctrl/Cmd + wheel → preventDefault + stopPropagation and we move the
|   camera ourselves. The container is `touch-action: pan-y`, so one finger
|   scrolls the page while two fingers still pinch-zoom the map.
|
| FALLBACK — no key, or the script failed to load: the OpenStreetMap embed
| iframe, which needs no key and still shows a marker (`marker=lat,lng`), so the
| map never breaks. An iframe swallows wheel events, so it starts with
| `pointer-events: none` behind a "click to interact" overlay — the page keeps
| scrolling until the visitor explicitly opts into the map.
|
| With no coordinates at all it degrades to an address panel with a link.
*/

/** Minimal shape of the pieces of the v3 global we touch. */
interface YandexMapInstance {
    update: (options: { location?: { center?: [number, number]; zoom?: number } }) => void;
    addChild: (child: unknown) => void;
    destroy: () => void;
}

interface YandexMaps3 {
    ready: Promise<void>;
    YMap: new (container: HTMLElement, options: unknown) => YandexMapInstance;
    YMapDefaultSchemeLayer: new (options: unknown) => unknown;
    YMapDefaultFeaturesLayer: new (options: unknown) => unknown;
    YMapMarker: new (options: unknown, element: HTMLElement) => unknown;
}

declare global {
    interface Window {
        ymaps3?: YandexMaps3;
    }
}

const SCRIPT_ID = 'yandex-maps-v3';
const LOAD_TIMEOUT_MS = 12_000;
const MIN_ZOOM = 3;
const MAX_ZOOM = 21;

export interface VenueMapProps {
    /** `null` when the setting is absent or not a number. */
    lat: number | null;
    lng: number | null;
    address: string | null;
    /** Yandex Maps API key; without it the OpenStreetMap embed is used. */
    apiKey?: string | null;
    /** Optional caption under the map. */
    note?: string | null;
    zoom?: number;
    className?: string;
}

/** Parses a settings value into a finite coordinate, or null. */
export function parseCoordinate(value: string | null | undefined): number | null {
    if (value === null || value === undefined || value.trim() === '') {
        return null;
    }

    const parsed = Number.parseFloat(value.replace(',', '.'));

    return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Injects the v3 script once and resolves with the global.
 *
 * A promise, not a hook: the component may mount twice (React 18 strict mode)
 * and the script tag must not be duplicated.
 */
function loadYandexMaps(apiKey: string): Promise<YandexMaps3> {
    return new Promise<YandexMaps3>((resolve, reject) => {
        const existing = window.ymaps3;

        if (existing !== undefined) {
            void existing.ready.then(() => resolve(existing));

            return;
        }

        let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

        if (script === null) {
            script = document.createElement('script');
            script.id = SCRIPT_ID;
            script.async = true;
            script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
            document.head.appendChild(script);
        }

        const fail = (message: string): void => {
            window.clearTimeout(timer);
            reject(new Error(message));
        };

        const timer = window.setTimeout(() => fail('yandex-maps-timeout'), LOAD_TIMEOUT_MS);

        script.addEventListener(
            'load',
            () => {
                const ymaps3 = window.ymaps3;

                if (ymaps3 === undefined) {
                    fail('yandex-maps-missing');

                    return;
                }

                window.clearTimeout(timer);
                void ymaps3.ready.then(() => resolve(ymaps3));
            },
            { once: true },
        );

        script.addEventListener('error', () => fail('yandex-maps-error'), { once: true });
    });
}

function markerElement(address: string | null): HTMLElement {
    const element = document.createElement('div');
    element.style.cssText = [
        'width:18px',
        'height:18px',
        'border-radius:9999px',
        'background:#d4af37',
        'border:3px solid #10100e',
        'box-shadow:0 0 0 2px rgba(212,175,55,0.55)',
        'transform:translate(-50%,-50%)',
    ].join(';');

    if (address !== null) {
        element.title = address;
    }

    return element;
}

export function VenueMap({
    lat,
    lng,
    address,
    apiKey = null,
    note,
    zoom = 16,
    className,
}: VenueMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<YandexMapInstance | null>(null);
    /** Current camera zoom, tracked so Ctrl+wheel can step it. */
    const zoomRef = useRef(zoom);
    /** 'idle' → script loading, 'ready' → v3 map, 'fallback' → embed iframe. */
    const [status, setStatus] = useState<'idle' | 'ready' | 'fallback'>('idle');
    /** The OSM iframe ignores the wheel until the visitor opts in. */
    const [iframeActive, setIframeActive] = useState(false);

    const hasPoint = lat !== null && lng !== null;
    const apiKeyValue = apiKey !== null && apiKey.trim() !== '' ? apiKey.trim() : null;

    // Reset the interaction state when the point or the key changes.
    useEffect(() => {
        setIframeActive(false);
    }, [lat, lng, apiKeyValue]);

    // Build the v3 map when an API key is configured.
    useEffect(() => {
        const container = containerRef.current;

        if (!hasPoint || apiKeyValue === null || lat === null || lng === null || container === null) {
            return;
        }

        let cancelled = false;

        zoomRef.current = zoom;

        void loadYandexMaps(apiKeyValue)
            .then((ymaps3) => {
                if (cancelled || containerRef.current === null) {
                    return;
                }

                const map = new ymaps3.YMap(container, {
                    location: { center: [lng, lat], zoom },
                    /*
                     * Deliberately no 'scrollZoom': with it the wheel would be
                     * swallowed. Everything else (drag, pinch, double click,
                     * magnifier) is fine.
                     */
                    behaviors: ['drag', 'pinchZoom', 'dblClick', 'magnifier'],
                });

                map.addChild(new ymaps3.YMapDefaultSchemeLayer({}));
                map.addChild(new ymaps3.YMapDefaultFeaturesLayer({}));
                map.addChild(
                    new ymaps3.YMapMarker({ coordinates: [lng, lat] }, markerElement(address)),
                );

                mapRef.current = map;
                setStatus('ready');
            })
            .catch(() => {
                // Blocked network, bad key, ad-blocker — the embed still works.
                if (!cancelled) {
                    setStatus('fallback');
                }
            });

        return () => {
            cancelled = true;
            setStatus('idle');

            const map = mapRef.current;
            mapRef.current = null;

            try {
                map?.destroy();
            } catch {
                // The API throws if the container was already torn down.
            }
        };
    }, [hasPoint, apiKeyValue, lat, lng, zoom, address]);

    /*
     * Ctrl/Cmd + wheel zooms the map; a plain wheel is left alone so the page
     * scrolls. `passive: false` is required for preventDefault to count — React's
     * onWheel is registered passively and would be ignored.
     */
    useEffect(() => {
        const container = containerRef.current;

        if (status !== 'ready' || container === null) {
            return;
        }

        const handleWheel = (event: WheelEvent): void => {
            if (!event.ctrlKey && !event.metaKey) {
                return; // Let it bubble: the page scrolls over the map.
            }

            event.preventDefault();
            event.stopPropagation();

            const map = mapRef.current;

            if (map === null) {
                return;
            }

            const step = event.deltaY > 0 ? -1 : 1;
            const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current + step));

            if (next === zoomRef.current) {
                return;
            }

            zoomRef.current = next;
            map.update({ location: { center: [lng as number, lat as number], zoom: next } });
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => container.removeEventListener('wheel', handleWheel);
    }, [status, lat, lng]);

    const fallbackQuery = encodeURIComponent(address ?? 'барбершоп');

    if (!hasPoint || lat === null || lng === null) {
        return (
            <div
                className={[
                    'relative flex min-h-[20rem] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-bg-elevated p-8 text-center',
                    className ?? '',
                ].join(' ')}
            >
                <MapPinIcon className="h-8 w-8 text-accent" />

                {address !== null && (
                    <p className="max-w-xs text-sm font-medium text-text-primary">{address}</p>
                )}

                <a
                    href={`https://yandex.ru/maps/?text=${fallbackQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-accent underline underline-offset-2 transition-all duration-300 hover:text-accent-hover"
                >
                    Открыть в картах
                </a>

                {note !== undefined && note !== null && (
                    <p className="text-xs text-text-secondary">{note}</p>
                )}
            </div>
        );
    }

    const useYandex = apiKeyValue !== null && status !== 'fallback';
    const d = 0.01;
    const embedSrc =
        `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d / 2}%2C${lng + d}%2C${lat + d / 2}` +
        `&layer=mapnik&marker=${lat}%2C${lng}`;

    return (
        /*
         * The map fills its grid cell completely: the grid stretches the cell to
         * the row height (the contact list beside it is taller), the wrapper is
         * `h-full`, and the address caption is OVERLAID on the bottom edge rather
         * than stacked under the map. A fixed height (it used to be h-[18rem])
         * plus an in-flow caption left ~45px of dead space beside the contact
         * block on every large screen.
         */
        <div className={['relative h-full', className ?? ''].join(' ')}>
            {useYandex ? (
                // Key configured: render (or keep) the v3 target. While the
                // script loads the container is simply empty, which is why the
                // border/background are already painted.
                <div
                    ref={containerRef}
                    className="h-full min-h-[20rem] w-full overflow-hidden rounded-2xl border border-border bg-bg-elevated [touch-action:pan-y]"
                    role="region"
                    aria-label={address === null ? 'Карта' : `Карта: ${address}`}
                />
            ) : (
                <div className="h-full min-h-[20rem] overflow-hidden rounded-2xl border border-border bg-bg-elevated">
                    <iframe
                        title={address === null ? 'Карта' : `Карта: ${address}`}
                        src={embedSrc}
                        loading="lazy"
                        className={[
                            // `h-full`: fills the stretched cell on lg+, with the
                            // 20rem floor keeping it usable once it stacks.
                            'block h-full min-h-[20rem] w-full border-0',
                            iframeActive ? '' : 'pointer-events-none',
                        ].join(' ')}
                    />

                    {!iframeActive && (
                        <button
                            type="button"
                            onClick={() => setIframeActive(true)}
                            className="absolute inset-0 flex items-end justify-center bg-black/5 pb-4 text-xs font-medium text-text-primary transition-all duration-300 hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            <span className="rounded-full border border-border bg-bg-elevated/95 px-3 py-1.5">
                                Нажмите, чтобы управлять картой
                            </span>
                        </button>
                    )}
                </div>
            )}

            {/* Overlaid, not stacked: an in-flow caption would shorten the map
                by its own height and leave the dead space the owner complained
                about. `pointer-events-none` keeps the map clickable behind it. */}
            {(address !== null || (note !== undefined && note !== null)) && (
                <p className="pointer-events-none absolute inset-x-3 bottom-3 rounded-xl border border-border bg-bg-elevated/90 px-3 py-2 text-xs text-text-secondary backdrop-blur">
                    {address}
                    {address !== null && note !== undefined && note !== null ? ' · ' : ''}
                    {note}
                </p>
            )}
        </div>
    );
}

export default VenueMap;
