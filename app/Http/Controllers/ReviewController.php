<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReviewRequest;
use App\Models\Appointment;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    /**
     * Creates a review for one of the client's completed visits.
     *
     * Reviews start unapproved and become public once an admin approves them.
     */
    public function store(StoreReviewRequest $request): RedirectResponse
    {
        $data = $request->validated();

        /** @var Appointment $appointment */
        $appointment = Appointment::query()
            ->whereKey($data['appointment_id'])
            ->where('client_id', $request->user()->id)
            ->firstOrFail();

        $this->authorize('review', $appointment);

        DB::transaction(function () use ($appointment, $data, $request): void {
            $review = Review::create([
                'client_id' => $appointment->client_id,
                'master_id' => $appointment->master_id,
                'appointment_id' => $appointment->id,
                'rating' => $data['rating'],
                'text' => $data['text'] ?? null,
                'is_approved' => false,
            ]);

            /*
             * The file is named after the row, so it is stored after create().
             * Keeping it inside the transaction means a storage failure rolls
             * the review back instead of leaving a photo-less orphan behind.
             */
            $file = $request->file('photo');

            if ($file !== null) {
                $path = $file->storeAs(
                    'reviews',
                    $review->id.'.'.strtolower($file->getClientOriginalExtension()),
                    ['disk' => 'public'],
                );

                $review->forceFill(['photo_path' => $path])->save();
            }
        });

        // masters.rating counts approved reviews only, so a pending review must
        // NOT move it. AdminReviewController recalculates on approve/destroy.

        return back()->with('success', 'Спасибо за отзыв! Он появится на сайте после проверки модератором.');
    }
}
