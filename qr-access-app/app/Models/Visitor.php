<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Visitor extends Model
{
    protected $fillable = [
        'user_id', 'name', 'category', 'type', 'sexe', 'location', 'photo',
        'start_time', 'end_time', 'quick_code', 'meta',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function accessLogs(): HasMany
    {
        return $this->hasMany(AccessLog::class);
    }

    public function toLegacyArray(): array
    {
        return array_merge([
            'id' => (string) $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'type' => $this->type,
            'sexe' => $this->sexe,
            'location' => $this->location,
            'photo' => $this->photo,
            'startTime' => $this->start_time,
            'endTime' => $this->end_time,
            'quickCode' => $this->quick_code,
        ], $this->meta ?? []);
    }
}
