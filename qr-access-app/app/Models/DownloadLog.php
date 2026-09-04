<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DownloadLog extends Model
{
    protected $fillable = ['user_id', 'ceremony_id', 'resource', 'file_name', 'downloaded_at'];

    protected function casts(): array
    {
        return ['downloaded_at' => 'datetime'];
    }

    public function ceremony(): BelongsTo
    {
        return $this->belongsTo(Ceremony::class)->withTrashed();
    }
}
