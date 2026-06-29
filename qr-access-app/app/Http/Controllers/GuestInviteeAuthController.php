<?php

namespace App\Http\Controllers;

use App\Models\Guest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class GuestInviteeAuthController extends Controller
{
    public function create(): View
    {
        return view('guest.login');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'quick_code' => ['required', 'string', 'regex:/^\d{5}$/'],
            'phone' => ['nullable', 'string', 'max:30'],
        ], [
            'quick_code.required' => 'Le code rapide est obligatoire.',
            'quick_code.regex' => 'Le code rapide doit contenir exactement 5 chiffres.',
        ]);

        $query = Guest::with('ceremony')
            ->where('quick_code', $validated['quick_code']);

        if (! empty($validated['phone'])) {
            $phone = preg_replace('/\s+/', '', $validated['phone']);
            $query->where(function ($q) use ($phone, $validated) {
                $q->where('phone', 'like', '%'.$validated['phone'].'%')
                    ->orWhere('phone', 'like', '%'.$phone.'%');
            });
        }

        $matches = $query->get();

        if ($matches->isEmpty()) {
            return back()
                ->withInput()
                ->with('notify_error', 'Code invité introuvable. Vérifiez votre code rapide et votre téléphone.');
        }

        if ($matches->count() > 1 && empty($validated['phone'])) {
            return back()
                ->withInput()
                ->with('notify_error', 'Plusieurs invités correspondent à ce code. Ajoutez votre numéro de téléphone.');
        }

        $guest = $matches->first();

        if (! $guest->ceremony) {
            return back()
                ->withInput()
                ->with('notify_error', 'Aucune cérémonie associée à votre invitation.');
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $request->session()->put([
            'invitee_guest_id' => $guest->id,
            'invitee_ceremony_id' => $guest->ceremony_id,
            'invitee_guest_name' => trim($guest->full_name ?: ($guest->first_name.' '.$guest->last_name)),
        ]);

        return redirect()
            ->route('invitee.gift')
            ->with('notify_success', 'Bienvenue ! Vous pouvez maintenant enregistrer un cadeau.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->session()->forget([
            'invitee_guest_id',
            'invitee_ceremony_id',
            'invitee_guest_name',
        ]);

        return redirect()
            ->route('invitee.login')
            ->with('notify_success', 'Vous êtes déconnecté.');
    }
}
