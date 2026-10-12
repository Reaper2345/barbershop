import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapPinIcon } from '@/lib/icons';

/*
|--------------------------------------------------------------------------
| VenueMap
|--------------------------------------------------------------------------
| Interactive OpenStreetMap map for the contacts block (home page and the
| CMS contacts page).
|
| Leaflet is a real npm dependency, not a CDN script: vite bundles the library
| and its stylesheet into public/build, so the page needs no third-party
| script host at runtime. Only the raster tiles come from openstreetmap.org,
| which is what "no API key" buys.
|
| Coordinates come from the `map_lat` / `map_lng` settings. When they are
| missing or unparsable the component degrades to a bordered panel with the
| address and an "Открыть в картах" link instead of an empty grey box.
|
| Leaflet ships its marker images as separate files and resolves them from a
| path that does not survive bundling, hence the explicit icon imports below.
*/

L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

export interface VenueMapProps {
    /** `null` when the setting is absent or not a number. */
    lat: number | null;
    lng: number | null;
    address: string | null;
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

export function VenueMap({
    lat,
    lng,
    address,
    note,
    zoom = 16,
    className,
}: VenueMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);

    const hasPoint = lat !== null && lng !== null;

    useEffect(() => {
        const container = containerRef.current;

        if (!hasPoint || container === null || lat === null || lng === null) {
            return;
        }

        // Leaflet throws "Map container is already initialized" when React
        // re-runs the effect, so an existing instance is torn down first.
        if (mapRef.current !== null) {
            mapRef.current.remove();
            mapRef.current = null;
        }

        const map = L.map(container, {
            center: [lat, lng],
            zoom,
            // The page scrolls; the map must not swallow the wheel.
            scrollWheelZoom: false,
            attributionControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            subdomains: 'abc',
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        L.marker([lat, lng]).addTo(map);

        mapRef.current = map;

        /*
         * The container is sized by the layout, and Leaflet measures it on
         * creation — inside a grid/flex box that measurement can happen before
         * the final size is known, which leaves grey bands. One invalidate
         * after the first paint fixes the tiles.
         */
        const frame = window.requestAnimationFrame(() => map.invalidateSize());

        return () => {
            window.cancelAnimationFrame(frame);
            map.remove();
            mapRef.current = null;
        };
    }, [hasPoint, lat, lng, zoom]);

    const fallbackQuery = encodeURIComponent(address ?? 'барбершоп');

    if (!hasPoint) {
        return (
            <div
                className={[
                    'relative flex min-h-[18rem] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-bg-elevated p-8 text-center',
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

    return (
        <div className={['relative', className ?? ''].join(' ')}>
            <div
                ref={containerRef}
                className="min-h-[18rem] w-full overflow-hidden rounded-2xl border border-border bg-bg-elevated"
                role="region"
                aria-label={address === null ? 'Карта' : `Карта: ${address}`}
            />

            {(address !== null || (note !== undefined && note !== null)) && (
                <p className="mt-3 text-xs text-text-secondary">
                    {address}
                    {address !== null && note !== undefined && note !== null ? ' · ' : ''}
                    {note}
                </p>
            )}
        </div>
    );
}

export default VenueMap;
