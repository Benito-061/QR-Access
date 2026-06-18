<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CeremonyManagement extends Model
{
    protected $table = 'ceremony_management';

    protected $fillable = [
        'ceremony_id', 'wedding_date', 'supplies_plates', 'supplies_forks',
        'supplies_glasses', 'custom_supplies', 'drinks', 'gifts',
    ];

    protected function casts(): array
    {
        return [
            'wedding_date' => 'datetime',
            'custom_supplies' => 'array',
            'drinks' => 'array',
            'gifts' => 'array',
        ];
    }

    public function ceremony(): BelongsTo
    {
        return $this->belongsTo(Ceremony::class);
    }

    public function toLegacyArray(): array
    {
        return [
            'id' => $this->ceremony_id,
            'data' => [
                'brideName' => $this->ceremony?->bride_name,
                'groomName' => $this->ceremony?->groom_name,
                'weddingDate' => $this->wedding_date?->toIso8601String(),
            ],
            'supplies' => [
                'plates' => $this->supplies_plates,
                'forks' => $this->supplies_forks,
                'glasses' => $this->supplies_glasses,
                'custom' => $this->custom_supplies ?? [],
            ],
            'drinks' => $this->drinks ?? [],
            'gifts' => $this->gifts ?? [],
        ];
    }
}
