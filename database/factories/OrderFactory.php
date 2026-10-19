<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Order> */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(), 'source' => 'STAFF_CREATED', 'status' => OrderStatus::DESIGN_STAGE, 'delivery_method' => 'PICKUP',
            'subtotal' => 5000, 'discount_amount' => 0, 'delivery_fee' => 0, 'grand_total' => 5000,
        ];
    }
}
