<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $t) {
            $t->id();
            $t->string('name', 100)->unique();
            $t->unsignedSmallInteger('sort_order')->default(0);
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
        Schema::create('products', function (Blueprint $t) {
            $t->id();
            $t->foreignId('category_id')->constrained('product_categories');
            $t->string('name', 150);
            $t->text('description')->nullable();
            $t->unsignedBigInteger('base_unit_price')->default(0); // قروش
            $t->unsignedInteger('minimum_quantity')->nullable();
            $t->foreignId('required_specialty_id')->nullable()->constrained('designer_specialties')->nullOnDelete();
            $t->boolean('is_active')->default(true);
            $t->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
            $t->index(['category_id', 'is_active']);
            $t->index('name');
        });
        Schema::create('product_option_groups', function (Blueprint $t) {
            $t->id();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->string('code', 40);
            $t->string('name', 100);
            $t->string('selection_type', 10)->default('SINGLE'); // SINGLE | MULTIPLE
            $t->boolean('is_required')->default(false);
            $t->unsignedSmallInteger('sort_order')->default(0);
            $t->boolean('is_active')->default(true);
            $t->timestamps();
            $t->unique(['product_id', 'code']);
        });
        Schema::create('product_option_values', function (Blueprint $t) {
            $t->id();
            $t->foreignId('option_group_id')->constrained('product_option_groups')->cascadeOnDelete();
            $t->string('name', 100);
            $t->unsignedBigInteger('unit_price_addition')->default(0); // قروش لكل وحدة
            $t->unsignedSmallInteger('sort_order')->default(0);
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
        Schema::create('tier_product_prices', function (Blueprint $t) {
            $t->id();
            $t->foreignId('tier_id')->constrained('pricing_tiers')->cascadeOnDelete();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->unsignedBigInteger('base_unit_price_override');
            $t->timestamps();
            $t->unique(['tier_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tier_product_prices');
        Schema::dropIfExists('product_option_values');
        Schema::dropIfExists('product_option_groups');
        Schema::dropIfExists('products');
        Schema::dropIfExists('product_categories');
    }
};
