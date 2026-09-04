<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ceremony extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'name', 'type', 'location', 'address', 'commune', 'capacity',
        'phone', 'sex', 'honorific', 'place', 'contact_email', 'contact_phone',
        'dress_code', 'start_datetime', 'end_datetime', 'church', 'church_address',
        'photographer', 'reception', 'bride_name', 'groom_name', 'family1', 'family2',
        'program', 'notes', 'quick_code', 'category',
    ];

    protected function casts(): array
    {
        return ['start_datetime' => 'datetime', 'end_datetime' => 'datetime'];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function guests(): HasMany { return $this->hasMany(Guest::class); }
    public function organizers(): HasMany { return $this->hasMany(Organizer::class); }
    public function management(): HasOne { return $this->hasOne(CeremonyManagement::class); }
    public function accessLogs(): HasMany { return $this->hasMany(AccessLog::class); }

    public function toLegacyArray(): array
    {
        return [
            'id' => $this->id,
            'data' => [
                'name' => $this->name, 'type' => $this->type, 'location' => $this->location,
                'address' => $this->address, 'commune' => $this->commune, 'capacity' => $this->capacity,
                'phone' => $this->phone, 'sex' => $this->sex, 'honorific' => $this->honorific,
                'place' => $this->place, 'contactEmail' => $this->contact_email, 'contactPhone' => $this->contact_phone,
                'dressCode' => $this->dress_code, 'startDateTime' => $this->start_datetime?->toIso8601String(),
                'endDateTime' => $this->end_datetime?->toIso8601String(), 'church' => $this->church,
                'churchAddress' => $this->church_address, 'photographer' => $this->photographer,
                'reception' => $this->reception, 'brideName' => $this->bride_name, 'groomName' => $this->groom_name,
                'family1' => $this->family1, 'family2' => $this->family2, 'program' => $this->program, 'notes' => $this->notes,
            ],
            'guests' => $this->guests->map(fn (Guest $guest) => $guest->toLegacyArray())->all(),
        ];
    }
}
