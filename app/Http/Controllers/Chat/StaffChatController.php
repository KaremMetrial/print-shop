<?php

namespace App\Http\Controllers\Chat;

use App\Enums\ErrorCode;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Services\Chat\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** شات البند للموظف/المصمم (JSON). الصلاحية عبر ChatService::staffAccess (المصمم المسند فقط). */
class StaffChatController extends Controller
{
    public function index(Request $request, OrderItem $item, ChatService $chat): JsonResponse
    {
        [$read, $send, $label] = $chat->staffAccess($request->user(), $item);
        abort_unless($read, 404); // لا نكشف وجود بنود الغير
        $messages = $chat->list($item, (int) $request->query('after', 0));

        return response()->json(['data' => $messages, 'meta' => ['locked' => $chat->isLocked($item), 'can_send' => $send && ! $chat->isLocked($item), 'label' => $label]]);
    }

    public function store(Request $request, OrderItem $item, ChatService $chat): JsonResponse
    {
        [$read, $send, $label] = $chat->staffAccess($request->user(), $item);
        abort_unless($read, 404);
        if (! $send) {
            throw new BusinessException(ErrorCode::INSUFFICIENT_PERMISSION);
        }
        $d = $request->validate(['body' => ['required', 'string', 'max:2000'], 'client_id' => ['required', 'string', 'max:64']]);

        return response()->json(['data' => $chat->send($item, 'staff', $request->user()->id, $label, $d['body'], $d['client_id'])], 201);
    }
}
