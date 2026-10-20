<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('image_search_index', function (Blueprint $t) {
            $t->id();
            $t->foreignId('file_id')->unique()->constrained('files')->cascadeOnDelete();
            $t->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $t->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $t->char('dhash', 16); // فرق التدرج 9×8 → 64 بت (hex)
            $t->char('ahash', 16); // المتوسط 8×8 → 64 بت (hex)
            $t->timestamps();
            $t->index('order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('image_search_index');
    }
};
