<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccessLog extends Model
{
    protected $fillable = [
        'user_id', 'visitor_id', 'guest_id', 'ceremony_id',
        'visitor_name', 'location', 'result', 'code_scanned', 'logged_at',
    ];

    protected function casts(): array
    {
        return [
            'logged_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function visitor(): BelongsTo
    {
        return $this->belongsTo(Visitor::class);
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
    }

    public function ceremony(): BelongsTo
    {
        return $this->belongsTo(Ceremony::class);
    }

    public function toLegacyArray(): array
    {
        return [
            'timestamp' => $this->logged_at->toIso8601String(),
            'visitorName' => $this->visitor_name,
            'location' => $this->location,
            'result' => $this->result,
        ];
    }
}
