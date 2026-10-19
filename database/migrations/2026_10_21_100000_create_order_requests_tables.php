<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_requests', function (Blueprint $t) {
            $t->id();
            $t->string('request_number', 20)->nullable()->unique();
            $t->foreignId('customer_id')->constrained('customers');
            $t->string('status', 16)->default('PENDING'); // PENDING | IN_REVIEW | ACCEPTED | REJECTED
            $t->string('delivery_method', 10)->default('PICKUP');
            $t->text('delivery_address')->nullable();
            $t->text('notes')->nullable();
            $t->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('review_started_at')->nullable();
            $t->timestamp('decided_at')->nullable();
            $t->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $t->text('reject_reason')->nullable();
            $t->foreignId('order_id')->nullable()->unique()->constrained('orders')->nullOnDelete(); // قبول مرة واحدة = أوردر واحد
            $t->timestamp('submitted_at')->useCurrent();
            $t->timestamps();
            $t->index(['status', 'submitted_at']);
        });
        Schema::create('order_request_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_request_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->constrained('products');
            $t->unsignedInteger('quantity');
            $t->unsignedInteger('original_quantity');
            $t->json('options');
            $t->text('notes')->nullable();
            $t->timestamps();
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE order_requests ADD CONSTRAINT chk_req_status CHECK (status IN ('PENDING','IN_REVIEW','ACCEPTED','REJECTED'))");
            DB::statement('ALTER TABLE order_request_items ADD CONSTRAINT chk_reqitem_qty CHECK (quantity >= 1)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('order_request_items');
        Schema::dropIfExists('order_requests');
    }
};
