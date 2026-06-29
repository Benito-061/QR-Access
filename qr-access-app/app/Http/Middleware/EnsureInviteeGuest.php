<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInviteeGuest
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->has('invitee_guest_id')) {
            return redirect()->route('invitee.login')
                ->with('notify_error', 'Connectez-vous avec votre code invité pour continuer.');
        }

        return $next($request);
    }
}
