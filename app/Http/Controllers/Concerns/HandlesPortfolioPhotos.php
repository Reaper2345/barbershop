<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Shared photo handling for portfolio items (admin + master panels).
 *
 * Two kinds of path live in `portfolio_items.photo_path`:
 *   - bundled placeholders, e.g. "portfolio/01.svg", shipped in
 *     public/images/portfolio/ and served from /images/... ,
 *   - real uploads under "portfolio/uploads/" on the `public` disk, served
 *     from /storage/... .
 *
 * Only uploads may ever be deleted from the disk; a bundled placeholder has no
 * file on the storage disk and must never be removed.
 */
trait HandlesPortfolioPhotos
{
    /** Directory (no trailing slash) holding uploads on the public disk. */
    protected string $portfolioUploadDir = 'portfolio/uploads';

    /** Placeholder used when an item has no uploaded photo. */
    protected string $portfolioPlaceholder = 'portfolio/01.svg';

    /**
     * Store an uploaded photo, or null when the request carries no file.
     */
    protected function storePortfolioPhoto(Request $request): ?string
    {
        if (! $request->hasFile('photo')) {
            return null;
        }

        $file = $request->file('photo');

        if ($file === null) {
            return null;
        }

        // Directory without a trailing slash: store() would otherwise join the
        // segments with a second "/" and write "portfolio/uploads//name.png".
        return $file->store($this->portfolioUploadDir, 'public');
    }

    /**
     * Delete a previous photo, but only when it is a real upload.
     */
    protected function deletePortfolioPhoto(?string $path): void
    {
        if ($path === null || ! str_starts_with($path, $this->portfolioUploadDir.'/')) {
            return;
        }

        Storage::disk('public')->delete($path);
    }

    /**
     * Value written when an editor explicitly clears the photo.
     *
     * `photo_path` is NOT NULL by design (every card must render an image), so
     * "remove" means "reset to the bundled placeholder" rather than null.
     */
    protected function withoutPortfolioPhoto(): string
    {
        return $this->portfolioPlaceholder;
    }
}
