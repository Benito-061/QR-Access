<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccessLog;
use App\Models\Ceremony;
use App\Models\CeremonyManagement;
use App\Models\Guest;
use App\Models\GuestScan;
use App\Models\Organizer;
use App\Models\Visitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DataSyncController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $ceremonies = Ceremony::where('user_id', $user->id)
            ->with(['guests.scans', 'management.ceremony', 'organizers'])
            ->orderBy('id')
            ->get();

        $visitors = Visitor::where('user_id', $user->id)->orderBy('id')->get();
        $accessLog = AccessLog::where('user_id', $user->id)
            ->orderByDesc('logged_at')
            ->limit(200)
            ->get();

        $managedCeremonies = $ceremonies->map(function (Ceremony $c) {
            $mgmt = $c->management;
            if (! $mgmt) {
                return null;
            }
            $legacy = $mgmt->toLegacyArray();
            $legacy['organizers'] = $c->organizers->map(fn ($o) => [
                'firstName' => $o->first_name,
                'lastName' => $o->last_name,
                'email' => $o->email,
                'phone' => $o->phone,
                'service' => $o->service,
            ])->all();

            return $legacy;
        })->filter()->values();

        return response()->json([
            'ceremonies' => $ceremonies->map->toLegacyArray()->values(),
            'visitors' => $visitors->map->toLegacyArray()->values(),
            'accessLog' => $accessLog->map->toLegacyArray()->values(),
            'managedCeremonies' => $managedCeremonies,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $payload = $request->validate([
            'ceremonies' => 'nullable|array',
            'visitors' => 'nullable|array',
            'accessLog' => 'nullable|array',
            'managedCeremonies' => 'nullable|array',
        ]);

        DB::transaction(function () use ($user, $payload) {
            if (isset($payload['ceremonies'])) {
                $this->syncCeremonies($user->id, $payload['ceremonies']);
            }
            if (isset($payload['visitors'])) {
                $this->syncVisitors($user->id, $payload['visitors']);
            }
            if (isset($payload['accessLog'])) {
                $this->syncAccessLogs($user->id, $payload['accessLog']);
            }
            if (isset($payload['managedCeremonies'])) {
                $this->syncManagedCeremonies($user->id, $payload['managedCeremonies']);
            }
        });

        return response()->json(['success' => true]);
    }

    private function syncCeremonies(int $userId, array $items): void
    {
        $ids = [];

        foreach ($items as $item) {
            $data = $item['data'] ?? [];
            $legacyId = isset($item['id']) && is_numeric($item['id']) ? (int) $item['id'] : null;

            $attributes = [
                'name' => $data['name'] ?? null,
                'type' => $data['type'] ?? null,
                'location' => $data['location'] ?? null,
                'address' => $data['address'] ?? null,
                'commune' => $data['commune'] ?? null,
                'capacity' => $data['capacity'] ?? 100,
                'phone' => $data['phone'] ?? null,
                'sex' => $data['sex'] ?? null,
                'honorific' => $data['honorific'] ?? null,
                'place' => $data['place'] ?? null,
                'contact_email' => $data['contactEmail'] ?? null,
                'contact_phone' => $data['contactPhone'] ?? null,
                'dress_code' => $data['dressCode'] ?? null,
                'start_datetime' => $data['startDateTime'] ?? null,
                'end_datetime' => $data['endDateTime'] ?? null,
                'church' => $data['church'] ?? null,
                'church_address' => $data['churchAddress'] ?? null,
                'photographer' => $data['photographer'] ?? null,
                'reception' => $data['reception'] ?? null,
                'bride_name' => $data['brideName'] ?? null,
                'groom_name' => $data['groomName'] ?? null,
                'family1' => $data['family1'] ?? null,
                'family2' => $data['family2'] ?? null,
                'program' => $data['program'] ?? null,
                'notes' => $data['notes'] ?? null,
            ];

            if ($legacyId && Ceremony::where('user_id', $userId)->where('id', $legacyId)->exists()) {
                $ceremony = Ceremony::where('user_id', $userId)->findOrFail($legacyId);
                $ceremony->update($attributes);
            } else {
                $ceremony = Ceremony::create(array_merge($attributes, ['user_id' => $userId]));
            }

            $ids[] = $ceremony->id;

            $guestIds = [];
            foreach ($item['guests'] ?? [] as $g) {
                $guestLegacyId = isset($g['id']) && is_numeric($g['id']) ? (int) $g['id'] : null;
                $guestAttrs = [
                    'first_name' => $g['firstName'] ?? $g['first_name'] ?? null,
                    'last_name' => $g['lastName'] ?? $g['last_name'] ?? $g['postName'] ?? null,
                    'full_name' => $g['fullName'] ?? $g['full_name'] ?? $g['nom'] ?? null,
                    'honorific' => $g['honorific'] ?? null,
                    'phone' => $g['phone'] ?? null,
                    'seat' => $g['seat'] ?? null,
                    'count' => (int) ($g['count'] ?? 1),
                    'guest_type' => $g['guest_type'] ?? $g['guestType'] ?? 'singleton',
                    'quick_code' => $g['quickCode'] ?? null,
                    'meta' => collect($g)->except(['id', 'firstName', 'lastName', 'scans'])->all(),
                ];

                if ($guestLegacyId && Guest::where('ceremony_id', $ceremony->id)->where('id', $guestLegacyId)->exists()) {
                    $guest = Guest::find($guestLegacyId);
                    $guest->update($guestAttrs);
                } else {
                    $guest = Guest::create(array_merge($guestAttrs, ['ceremony_id' => $ceremony->id]));
                }

                $guestIds[] = $guest->id;

                $guest->scans()->delete();
                foreach ($g['scans'] ?? [] as $scan) {
                    GuestScan::create([
                        'guest_id' => $guest->id,
                        'scanned_at' => $scan['timestamp'] ?? now(),
                        'source' => $scan['source'] ?? 'qr-scan',
                    ]);
                }
            }

            Guest::where('ceremony_id', $ceremony->id)->whereNotIn('id', $guestIds)->delete();
        }

        if ($ids) {
            Ceremony::where('user_id', $userId)->whereNotIn('id', $ids)->delete();
        }
    }

    private function syncVisitors(int $userId, array $items): void
    {
        $ids = [];
        foreach ($items as $v) {
            $legacyId = isset($v['id']) && is_numeric($v['id']) ? (int) $v['id'] : null;
            $attrs = [
                'name' => $v['name'] ?? 'Sans nom',
                'category' => $v['category'] ?? 'rendezvous',
                'type' => $v['type'] ?? null,
                'sexe' => $v['sexe'] ?? null,
                'location' => $v['location'] ?? null,
                'photo' => $v['photo'] ?? null,
                'start_time' => $v['startTime'] ?? now(),
                'end_time' => $v['endTime'] ?? now()->addHour(),
                'quick_code' => $v['quickCode'] ?? null,
                'meta' => collect($v)->except(['id', 'name', 'startTime', 'endTime'])->all(),
            ];

            if ($legacyId && Visitor::where('user_id', $userId)->where('id', $legacyId)->exists()) {
                $visitor = Visitor::find($legacyId);
                $visitor->update($attrs);
            } else {
                $visitor = Visitor::create(array_merge($attrs, ['user_id' => $userId]));
            }
            $ids[] = $visitor->id;
        }
        if ($ids) {
            Visitor::where('user_id', $userId)->whereNotIn('id', $ids)->delete();
        }
    }

    private function syncAccessLogs(int $userId, array $items): void
    {
        AccessLog::where('user_id', $userId)->delete();
        foreach ($items as $log) {
            AccessLog::create([
                'user_id' => $userId,
                'visitor_name' => $log['visitorName'] ?? 'Inconnu',
                'location' => $log['location'] ?? null,
                'result' => ($log['result'] ?? 'approved') === 'denied' ? 'denied' : 'approved',
                'code_scanned' => $log['code'] ?? null,
                'logged_at' => $log['timestamp'] ?? now(),
            ]);
        }
    }

    private function syncManagedCeremonies(int $userId, array $items): void
    {
        foreach ($items as $m) {
            $ceremonyId = $m['id'] ?? null;
            if (! $ceremonyId || ! Ceremony::where('user_id', $userId)->where('id', $ceremonyId)->exists()) {
                continue;
            }

            $supplies = $m['supplies'] ?? [];
            CeremonyManagement::updateOrCreate(
                ['ceremony_id' => $ceremonyId],
                [
                    'wedding_date' => $m['data']['weddingDate'] ?? null,
                    'supplies_plates' => $supplies['plates'] ?? 0,
                    'supplies_forks' => $supplies['forks'] ?? 0,
                    'supplies_glasses' => $supplies['glasses'] ?? 0,
                    'custom_supplies' => $supplies['custom'] ?? [],
                    'drinks' => $m['drinks'] ?? [],
                    'gifts' => $m['gifts'] ?? [],
                ]
            );

            Organizer::where('ceremony_id', $ceremonyId)->delete();
            foreach ($m['organizers'] ?? [] as $o) {
                Organizer::create([
                    'ceremony_id' => $ceremonyId,
                    'first_name' => $o['firstName'] ?? $o['first_name'] ?? '',
                    'last_name' => $o['lastName'] ?? $o['last_name'] ?? null,
                    'email' => $o['email'] ?? null,
                    'phone' => $o['phone'] ?? null,
                    'service' => $o['service'] ?? null,
                ]);
            }
        }
    }
}
