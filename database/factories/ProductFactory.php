<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Product> */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category_id' => ProductCategory::firstOrCreate(['name' => 'مطبوعات ورقية'])->id,
            'name' => fake()->unique()->words(2, true),
            'description' => null,
            'base_unit_price' => 200,
            'minimum_quantity' => null,
            'is_active' => true,
        ];
    }
}
