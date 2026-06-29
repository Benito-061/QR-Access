<x-guest-layout :title="'Ajouter un cadeau'" :guest-display-name="$guestDisplayName">
    <div class="guest-card">
        <div class="guest-card-header">
            <h1><i class="fa-solid fa-champagne-glasses"></i> {{ $ceremony->name ?? 'Cérémonie' }}</h1>
            <p>
                @if($ceremony->bride_name && $ceremony->groom_name)
                    {{ $ceremony->bride_name }} &amp; {{ $ceremony->groom_name }}
                @else
                    {{ $ceremony->type ?? 'Événement' }}
                @endif
                @if($ceremony->location)
                    · <i class="fa-solid fa-location-dot"></i> {{ $ceremony->location }}
                @endif
            </p>
        </div>

        <div class="guest-restricted-note">
            <i class="fa-solid fa-circle-info"></i>
            En tant qu'invité, vous pouvez uniquement <strong>ajouter un cadeau</strong> pour cette cérémonie.
        </div>

        <form method="POST" action="{{ route('invitee.gift.store') }}" class="guest-gift-form">
            @csrf

            <div class="auth-field">
                <label for="type">Type de cadeau</label>
                <input
                    id="type"
                    type="text"
                    name="type"
                    value="{{ old('type') }}"
                    required
                    placeholder="Ex: Argent, Fleurs, Vaisselle..."
                >
                @error('type')
                    <p class="auth-field-error">{{ $message }}</p>
                @enderror
            </div>

            <div class="auth-field">
                <label for="from">Offert par</label>
                <input
                    id="from"
                    type="text"
                    name="from"
                    value="{{ old('from', $guestDisplayName) }}"
                    required
                    placeholder="Votre nom ou celui du donateur"
                >
                @error('from')
                    <p class="auth-field-error">{{ $message }}</p>
                @enderror
            </div>

            <div class="auth-field">
                <label for="date">Date du cadeau</label>
                <input
                    id="date"
                    type="date"
                    name="date"
                    value="{{ old('date', now()->toDateString()) }}"
                >
                @error('date')
                    <p class="auth-field-error">{{ $message }}</p>
                @enderror
            </div>

            <button type="submit" class="auth-submit guest-submit">
                <i class="fa-solid fa-gift"></i>
                Enregistrer le cadeau
            </button>
        </form>
    </div>

    @if($myGifts->isNotEmpty())
        <div class="guest-card guest-card--list">
            <h2><i class="fa-solid fa-list"></i> Vos cadeaux enregistrés</h2>
            <ul class="guest-gift-list">
                @foreach($myGifts as $gift)
                    <li>
                        <div>
                            <strong>{{ $gift['type'] ?? '—' }}</strong>
                            <span>Offert par {{ $gift['from'] ?? '—' }}</span>
                        </div>
                        <time>{{ isset($gift['date']) ? \Illuminate\Support\Carbon::parse($gift['date'])->format('d/m/Y') : '—' }}</time>
                    </li>
                @endforeach
            </ul>
        </div>
    @endif
</x-guest-layout>
