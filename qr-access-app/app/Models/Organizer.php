<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Organizer extends Model
{
    protected $fillable = [
        'ceremony_id', 'first_name', 'last_name', 'email', 'phone', 'service',
    ];

    public function ceremony(): BelongsTo
    {
        return $this->belongsTo(Ceremony::class);
    }
}
