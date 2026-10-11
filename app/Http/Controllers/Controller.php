<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Collection;

abstract class Controller
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Materialise an API resource (or collection / paginator of resources) into
     * a plain Inertia prop array.
     *
     * resolve() is called eagerly on purpose: a lazy AnonymousResourceCollection
     * otherwise serialises through JsonSerializable in a context we do not
     * control once Inertia owns the prop.
     *
     * Usage:  Inertia::render('X', [...$this->toProps($resource, 'items'), ...])
     *
     * A paginator additionally yields "<key>_meta" and "<key>_links" so the
     * React tables can render paging controls without unwrapping a nested shape.
     *
     * @param  JsonResource|ResourceCollection|LengthAwarePaginator|Collection<int, mixed>|array<mixed>|null  $resource
     * @return array<string, mixed>
     */
    protected function toProps(mixed $resource, string $key = 'data', ?Request $request = null): array
    {
        if ($resource === null) {
            return [$key => null];
        }

        $request ??= request();

        if ($resource instanceof LengthAwarePaginator) {
            return [
                $key => JsonResource::collection($resource->items())->resolve($request),
                $key.'_meta' => [
                    'current_page' => $resource->currentPage(),
                    'last_page' => $resource->lastPage(),
                    'per_page' => $resource->perPage(),
                    'total' => $resource->total(),
                    'from' => $resource->firstItem(),
                    'to' => $resource->lastItem(),
                ],
                $key.'_links' => [
                    'first' => $resource->url(1),
                    'prev' => $resource->previousPageUrl(),
                    'next' => $resource->nextPageUrl(),
                    'last' => $resource->url($resource->lastPage()),
                ],
            ];
        }

        if ($resource instanceof ResourceCollection && $resource->resource instanceof LengthAwarePaginator) {
            /*
             * The usual `AppointmentResource::collection($paginator)` must carry
             * the same envelope as a raw paginator below. Without it the admin
             * DataTable never sees `meta`, silently drops into client-side mode,
             * and column sorting stays in the browser instead of hitting
             * ?sort=&dir=.
             */
            $paginator = $resource->resource;

            return [
                $key => $resource->resolve($request),
                $key.'_meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'from' => $paginator->firstItem(),
                    'to' => $paginator->lastItem(),
                ],
                $key.'_links' => [
                    'first' => $paginator->url(1),
                    'prev' => $paginator->previousPageUrl(),
                    'next' => $paginator->nextPageUrl(),
                    'last' => $paginator->url($paginator->lastPage()),
                ],
            ];
        }

        if ($resource instanceof ResourceCollection || $resource instanceof JsonResource) {
            return [$key => $resource->resolve($request)];
        }

        if ($resource instanceof Collection) {
            return [$key => $resource->values()->all()];
        }

        return [$key => $resource];
    }

    /**
     * Same pagination envelope as toProps(), for plain data with no resource
     * class (admin CRUD tables). Avoids the ambiguity of handing a raw
     * LengthAwarePaginator to Inertia alongside other props.
     *
     * @param  LengthAwarePaginator  $paginator  paginator of arrays or models
     * @return array<string, mixed>
     */
    protected function paginated(LengthAwarePaginator $paginator, string $key = 'data'): array
    {
        return [
            $key => collect($paginator->items())
                ->map(static fn ($item): mixed => $item instanceof JsonResource
                    ? $item->resolve()
                    : $item)
                ->values()
                ->all(),
            $key.'_meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            $key.'_links' => [
                'first' => $paginator->url(1),
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
                'last' => $paginator->url($paginator->lastPage()),
            ],
        ];
    }
}
