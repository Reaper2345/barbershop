import { useState } from 'react';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| Img
|--------------------------------------------------------------------------
| <img> with a guaranteed landing spot when the file is missing.
|
| The database stores starter photos such as "masters/ivan-sokolov.jpg"; those
| files are not part of the repository, so on a fresh checkout (before the
| seeder's images are uploaded, or before `php artisan storage:link`) the
| request 404s. Falling back to the bundled SVG keeps the layout intact
| instead of showing a broken-image icon.
*/

export interface ImgProps {
    src: string;
    /** Second candidate tried before the generic placeholder. */
    fallbackSrc: string;
    alt: string;
    className?: string;
    loading?: 'lazy' | 'eager';
    width?: number;
    height?: number;
    /** Applied to the wrapper that owns the aspect ratio. */
    wrapperClassName?: string;
}

export function Img({
    src,
    fallbackSrc,
    alt,
    className,
    loading = 'lazy',
    width,
    height,
    wrapperClassName,
}: ImgProps) {
    const [current, setCurrent] = useState(src);
    const [stage, setStage] = useState<0 | 1 | 2>(0);
    /**
     * The `src` the state above was derived from.
     *
     * WITHOUT this, `<Img>` showed the FIRST source it ever received forever:
     * `useState(src)` only reads the prop on mount, so a gallery that swaps
     * `src` (the portfolio modal's arrows, for example) updated every other
     * field while the picture stayed behind. Resetting during render is the
     * React-documented "adjust state when a prop changes" pattern.
     */
    const [tracked, setTracked] = useState(src);

    if (src !== tracked) {
        setTracked(src);
        setCurrent(src);
        setStage(0);
    }

    const handleError = (): void => {
        if (stage === 0 && fallbackSrc !== src) {
            setStage(1);
            setCurrent(fallbackSrc);

            return;
        }

        if (stage !== 2) {
            setStage(2);
            setCurrent('/images/placeholder-master.svg');
        }
    };

    const element = (
        <img
            src={current}
            alt={alt}
            loading={loading}
            decoding="async"
            width={width}
            height={height}
            onError={handleError}
            className={cn('h-full w-full object-cover', className)}
        />
    );

    if (wrapperClassName === undefined) {
        return element;
    }

    return <div className={wrapperClassName}>{element}</div>;
}

export default Img;
