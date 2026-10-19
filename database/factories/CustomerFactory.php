<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\PricingTier;
use App\Support\PhoneNormalizer;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Customer> */
class CustomerFactory extends Factory
{
    public function definition(): array
    {
        $phone = '010'.fake()->unique()->numerify('########');

        return [
            'name' => fake()->company(),
            'phone_normalized' => $phone,
            'phone_display' => PhoneNormalizer::display($phone),
            'address' => fake()->address(),
            'pricing_tier_id' => PricingTier::default()->id,
            'notification_mode' => 'SYSTEM_DEFAULT',
        ];
    }
}
