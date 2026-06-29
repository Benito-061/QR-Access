<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectInviteeFromAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->session()->has('invitee_guest_id')) {
            return redirect()->route('invitee.gift')
                ->with('notify_error', 'Déconnectez-vous de l\'espace invité pour accéder à l\'administration.');
        }

        return $next($request);
    }
}
