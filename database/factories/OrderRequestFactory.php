<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\OrderRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<OrderRequest> */
class OrderRequestFactory extends Factory
{
    public function definition(): array
    {
        return ['customer_id' => Customer::factory(), 'status' => 'PENDING', 'delivery_method' => 'PICKUP', 'submitted_at' => now()];
    }
}
