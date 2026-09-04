<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ceremony;
use App\Models\DownloadLog;
use App\Models\Guest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ToolsApiController extends Controller
{
    public function downloads(Request $request): JsonResponse
    {
        return response()->json(['logs' => DownloadLog::where('user_id', $request->user()->id)->with('ceremony')->latest('downloaded_at')->limit(500)->get()]);
    }

    public function recordDownload(Request $request): JsonResponse
    {
        $data = $request->validate(['resource' => 'required|string|max:100', 'file_name' => 'nullable|string|max:255', 'ceremony_id' => 'nullable|integer']);
        return response()->json(['log' => DownloadLog::create(array_merge($data, ['user_id' => $request->user()->id, 'downloaded_at' => now()]))], 201);
    }

    public function trash(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        return response()->json(['ceremonies' => Ceremony::onlyTrashed()->where('user_id', $userId)->get(), 'guests' => Guest::onlyTrashed()->whereHas('ceremony', fn ($q) => $q->withTrashed()->where('user_id', $userId))->with('ceremony')->get()]);
    }

    public function restore(Request $request, string $type, int $id): JsonResponse
    {
        $item = $this->trashItem($request, $type, $id); $item->restore(); return response()->json(['success' => true]);
    }

    public function destroyTrash(Request $request, string $type, int $id): JsonResponse
    {
        $item = $this->trashItem($request, $type, $id); $item->forceDelete(); return response()->json(['success' => true]);
    }

    private function trashItem(Request $request, string $type, int $id): Ceremony|Guest
    {
        $userId = $request->user()->id;
        if ($type === 'ceremony') return Ceremony::onlyTrashed()->where('user_id', $userId)->findOrFail($id);
        if ($type === 'guest') return Guest::onlyTrashed()->whereHas('ceremony', fn ($q) => $q->withTrashed()->where('user_id', $userId))->findOrFail($id);
        abort(404);
    }
}
