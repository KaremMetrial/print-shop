<?php

namespace App\Actions\Orders;

use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Product;
use App\Services\Notifications\NotificationService;
use App\Services\Pricing\PricingService;
use Illuminate\Support\Facades\DB;

/** العميل المسجّل يرسل طلب أوردر (وليس أوردرًا): يحتاج مراجعة بشرية (BR-008/009). التحقق بنفس محرك التسعير. */
class SubmitOrderRequest
{
    public function __construct(private PricingService $pricing, private NotificationService $notify) {}

    /** @param array<string, mixed> $data */
    public function handle(Customer $customer, array $data): OrderRequest
    {
        $customer->loadMissing('pricingTier');
        foreach ($data['items'] as $row) {
            $this->pricing->quoteItem(Product::findOrFail($row['product_id']), $row['options'] ?? [], (int) $row['quantity'], $customer->pricingTier); // MOQ/خيارات/نشاط
        }

        return DB::transaction(function () use ($customer, $data) {
            $r = OrderRequest::create([
                'customer_id' => $customer->id, 'status' => 'PENDING', 'delivery_method' => $data['delivery_method'],
                'delivery_address' => $data['delivery_method'] === 'DELIVERY' ? ($data['delivery_address'] ?? $customer->address) : null, 'notes' => $data['notes'] ?? null, 'submitted_at' => now(),
            ]);
            foreach ($data['items'] as $row) {
                $r->items()->create(['product_id' => $row['product_id'], 'quantity' => $row['quantity'], 'original_quantity' => $row['quantity'], 'options' => $row['options'] ?? [], 'notes' => $row['notes'] ?? null]);
            }
            DB::table('audit_logs')->insert(['actor_type' => 'customer', 'actor_id' => $customer->id, 'actor_role_snapshot' => 'CUSTOMER', 'entity_type' => $r->getMorphClass(), 'entity_id' => $r->id, 'action' => 'order_request.submitted', 'new_values' => json_encode(['items' => count($data['items'])]), 'created_at' => now()]);
            $ref = (string) $r->refresh()->request_number;
            $id = $this->notify->openAction("request:{$r->id}", 'ORDER_REQUEST', "مراجعة طلب أوردر {$ref}", $customer->name, $ref, "/order-requests/{$r->id}");
            if ($id) {
                $this->notify->notify(['order_requests.review'], 'ACTION_REQUIRED', "طلب أوردر جديد {$ref} يحتاج المراجعة", $customer->name, "/order-requests/{$r->id}", $id);
            }

            return $r;
        });
    }
}
