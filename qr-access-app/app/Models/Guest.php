<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Guest extends Model
{
    use SoftDeletes;

    protected $fillable = ['ceremony_id', 'first_name', 'last_name', 'full_name', 'honorific', 'phone', 'seat', 'count', 'guest_type', 'quick_code', 'meta'];

    protected function casts(): array
    {
        return ['meta' => 'array', 'count' => 'integer'];
    }

    public function ceremony(): BelongsTo { return $this->belongsTo(Ceremony::class); }
    public function scans(): HasMany { return $this->hasMany(GuestScan::class); }

    public function toLegacyArray(): array
    {
        $scans = $this->scans->map(fn (GuestScan $s) => ['timestamp' => $s->scanned_at->toIso8601String(), 'source' => $s->source])->all();
        return array_merge(['id' => $this->id, 'firstName' => $this->first_name, 'lastName' => $this->last_name, 'fullName' => $this->full_name, 'honorific' => $this->honorific, 'phone' => $this->phone, 'seat' => $this->seat, 'count' => $this->count, 'quickCode' => $this->quick_code, 'scans' => $scans], $this->meta ?? []);
    }
}
