<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $t) {
            $t->id();
            $t->string('order_number', 20)->nullable()->unique();
            $t->foreignId('customer_id')->constrained('customers');
            $t->string('source', 20)->default('STAFF_CREATED'); // STAFF_CREATED | ACCEPTED_REQUEST
            $t->string('status', 24)->default('DESIGN_STAGE');
            $t->string('delivery_method', 10)->default('PICKUP'); // PICKUP | DELIVERY
            $t->text('delivery_address')->nullable(); // snapshot
            $t->unsignedTinyInteger('printing_eta_days')->nullable();
            $t->unsignedBigInteger('subtotal')->default(0);
            $t->string('discount_type', 8)->default('NONE');
            $t->decimal('discount_value', 12, 2)->default(0); // نسبة أو قروش حسب النوع
            $t->unsignedBigInteger('discount_amount')->default(0);
            $t->unsignedBigInteger('delivery_fee')->default(0);
            $t->unsignedBigInteger('grand_total')->default(0);
            $t->text('notes')->nullable();
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('printing_started_at')->nullable();
            $t->timestamp('out_for_delivery_at')->nullable();
            $t->timestamp('completed_at')->nullable();
            $t->string('completed_source', 12)->nullable(); // MANUAL | AUTO
            $t->timestamp('cancelled_at')->nullable();
            $t->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $t->text('cancel_reason')->nullable();
            $t->timestamps();
            $t->index(['status', 'created_at']);
            $t->index('customer_id');
        });
        Schema::create('order_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->constrained('products');
            $t->json('product_snapshot');
            $t->json('options_snapshot');
            $t->unsignedInteger('quantity');
            $t->unsignedBigInteger('base_unit_price');
            $t->unsignedBigInteger('options_unit_price')->default(0);
            $t->bigInteger('tier_adjustment')->default(0);
            $t->unsignedBigInteger('unit_price'); // السعر النهائي للوحدة (snapshot)
            $t->unsignedBigInteger('item_total');
            $t->foreignId('designer_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('design_state', 24)->default('NEW');
            $t->unsignedBigInteger('approved_version_id')->nullable();
            $t->timestamp('approved_at')->nullable();
            $t->text('notes')->nullable();
            $t->timestamp('cancelled_at')->nullable(); // soft-cancel للبند
            $t->string('cancel_reason', 255)->nullable();
            $t->timestamps();
            $t->index(['order_id', 'cancelled_at']);
            $t->index(['designer_id', 'design_state']);
        });
        Schema::create('item_assignment_history', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $t->foreignId('designer_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('mode', 10); // AUTO | MANUAL
            $t->string('reason', 255)->nullable();
            $t->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('created_at')->useCurrent();
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE orders ADD CONSTRAINT chk_orders_total CHECK (grand_total >= 0)');
            DB::statement("ALTER TABLE orders ADD CONSTRAINT chk_orders_delivery CHECK (delivery_method IN ('PICKUP','DELIVERY'))");
            DB::statement('ALTER TABLE order_items ADD CONSTRAINT chk_items_qty CHECK (quantity >= 1)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('item_assignment_history');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
