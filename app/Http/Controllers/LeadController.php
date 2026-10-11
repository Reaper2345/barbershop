<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCallRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;

class LeadController extends Controller
{
    /**
     * "Заказать звонок" modal.
     *
     * The PROMPT 1 schema has no leads table, so the request is validated and
     * written to the application log instead. Swap the Log call for a model
     * once a `leads` table exists.
     */
    public function store(StoreCallRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Log::info('Заявка на обратный звонок', [
            'name' => $data['name'],
            'phone' => $data['phone'],
            'comment' => $data['comment'] ?? null,
            'ip' => $request->ip(),
            'user_id' => $request->user()?->id,
        ]);

        return back()->with('success', 'Спасибо! Мы позвоним вам в ближайшее время.');
    }
}
