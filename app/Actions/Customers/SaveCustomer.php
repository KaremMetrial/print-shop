<?php

namespace App\Actions\Customers;

use App\Models\Customer;
use App\Models\PricingTier;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Support\PhoneNormalizer;
use Illuminate\Support\Facades\DB;

class SaveCustomer
{
    public function __construct(private AuditService $audit) {}

    /** @param array<string, mixed> $data بيانات متحقق منها (وفيها phone_normalized) */
    public function handle(User $actor, array $data, ?Customer $customer = null): Customer
    {
        return DB::transaction(function () use ($actor, $data, $customer) {
            $attrs = [
                'name' => trim($data['name']),
                'phone_normalized' => $data['phone_normalized'],
                'phone_display' => PhoneNormalizer::display($data['phone_normalized']),
                'address' => $data['address'] ?? null,
                'pricing_tier_id' => $data['pricing_tier_id'] ?? ($customer->pricing_tier_id ?? PricingTier::default()->id),
                'notification_mode' => $data['notification_mode'] ?? ($customer ? $customer->notification_mode->value : 'SYSTEM_DEFAULT'),
                'notes' => $data['notes'] ?? null,
            ];

            if (! $customer) {
                $customer = Customer::create($attrs + ['created_by' => $actor->id]);
                $this->audit->record('customer.created', $customer, [], ['name' => $customer->name, 'phone' => $customer->phone_display]);

                return $customer;
            }

            $before = $this->snapshot($customer);
            $customer->update($attrs);
            [$old, $new] = $this->audit->diff($before, $this->snapshot($customer->refresh()));
            if ($new) {
                // تغيير الشريحة له حدث مستقل لوضوح السجل (S-032)
                $action = array_key_exists('pricing_tier_id', $new) ? 'customer.tier_changed' : 'customer.updated';
                $this->audit->record($action, $customer, $old, $new);
            }

            return $customer;
        });
    }

    /** @return array<string, mixed> */
    private function snapshot(Customer $c): array
    {
        return ['name' => $c->name, 'phone' => $c->phone_display, 'address' => $c->address, 'pricing_tier_id' => $c->pricing_tier_id, 'notification_mode' => $c->notification_mode->value, 'notes' => $c->notes];
    }
}
