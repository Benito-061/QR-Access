<?php

namespace App\Http\Controllers;

use App\Models\CeremonyManagement;
use App\Models\Guest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\View\View;

class GuestGiftController extends Controller
{
    public function index(Request $request): View
    {
        $guest = $this->currentGuest($request);
        $ceremony = $guest->ceremony;

        $management = CeremonyManagement::firstOrCreate(
            ['ceremony_id' => $ceremony->id],
            [
                'supplies_plates' => 0,
                'supplies_forks' => 0,
                'supplies_glasses' => 0,
                'custom_supplies' => [],
                'drinks' => [],
                'gifts' => [],
            ]
        );

        $myGifts = collect($management->gifts ?? [])
            ->filter(fn (array $gift) => ($gift['guestId'] ?? null) == $guest->id)
            ->values();

        $guestDisplayName = $request->session()->get('invitee_guest_name')
            ?: trim($guest->full_name ?: ($guest->first_name.' '.$guest->last_name));

        return view('guest.gift', [
            'guest' => $guest,
            'ceremony' => $ceremony,
            'guestDisplayName' => $guestDisplayName,
            'myGifts' => $myGifts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $guest = $this->currentGuest($request);

        $validated = $request->validate([
            'type' => ['required', 'string', 'max:255'],
            'from' => ['required', 'string', 'max:255'],
            'date' => ['nullable', 'date'],
        ], [
            'type.required' => 'Indiquez le type de cadeau.',
            'from.required' => 'Indiquez le nom du donateur.',
        ]);

        $management = CeremonyManagement::firstOrCreate(
            ['ceremony_id' => $guest->ceremony_id],
            [
                'supplies_plates' => 0,
                'supplies_forks' => 0,
                'supplies_glasses' => 0,
                'custom_supplies' => [],
                'drinks' => [],
                'gifts' => [],
            ]
        );

        $gifts = $management->gifts ?? [];
        $gifts[] = [
            'id' => (string) Str::uuid(),
            'type' => $validated['type'],
            'from' => $validated['from'],
            'date' => $validated['date'] ?? now()->toDateString(),
            'addedAt' => now()->toIso8601String(),
            'guestId' => $guest->id,
            'addedByGuest' => true,
        ];

        $management->gifts = $gifts;
        $management->save();

        return redirect()
            ->route('invitee.gift')
            ->with('notify_success', 'Votre cadeau a été enregistré avec succès.');
    }

    private function currentGuest(Request $request): Guest
    {
        $guestId = $request->session()->get('invitee_guest_id');
        $ceremonyId = $request->session()->get('invitee_ceremony_id');

        $guest = Guest::with('ceremony')->findOrFail($guestId);

        if ((int) $guest->ceremony_id !== (int) $ceremonyId) {
            abort(403);
        }

        return $guest;
    }
}
