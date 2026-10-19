<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $t) {
            $t->id();
            $t->string('number', 20)->nullable()->unique(); // PAY-0914
            $t->foreignId('customer_id')->constrained('customers');
            $t->unsignedBigInteger('amount'); // قروش
            $t->string('method', 20); // CASH | BANK_TRANSFER | WALLET | CARD
            $t->string('status', 10)->default('CONFIRMED'); // CONFIRMED | VOIDED
            $t->foreignId('target_order_id')->nullable()->constrained('orders')->nullOnDelete(); // دفعة مخصصة لأوردر (BR-051)
            $t->string('reference', 100)->nullable();
            $t->text('notes')->nullable();
            $t->timestamp('received_at')->useCurrent();
            $t->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('voided_at')->nullable();
            $t->text('void_reason')->nullable();
            $t->timestamps();
            $t->index(['customer_id', 'status']);
        });
        Schema::create('payment_allocations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $t->foreignId('order_id')->constrained('orders');
            $t->unsignedBigInteger('amount');
            $t->timestamps();
            $t->index('order_id');
        });
        Schema::create('payment_adjustments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $t->string('type', 12); // AMOUNT | VOID
            $t->unsignedBigInteger('old_amount');
            $t->unsignedBigInteger('new_amount')->nullable();
            $t->text('reason');
            $t->foreignId('adjusted_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('created_at')->useCurrent();
        });
        Schema::create('refund_obligations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->unique()->constrained('orders');
            $t->foreignId('customer_id')->constrained('customers');
            $t->unsignedBigInteger('amount_due'); // Refund Due (BR-045) ≠ Refund Paid (BR-046)
            $t->timestamps();
        });
        Schema::create('refund_payouts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('obligation_id')->constrained('refund_obligations')->cascadeOnDelete();
            $t->unsignedBigInteger('amount');
            $t->string('method', 20);
            $t->text('notes')->nullable();
            $t->foreignId('paid_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('paid_at')->useCurrent();
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE payments ADD CONSTRAINT chk_pay_amount CHECK (amount > 0)');
            DB::statement('ALTER TABLE payment_allocations ADD CONSTRAINT chk_alloc_amount CHECK (amount > 0)');
            DB::statement('ALTER TABLE refund_payouts ADD CONSTRAINT chk_payout_amount CHECK (amount > 0)');
        }
    }

    public function down(): void
    {
        foreach (['refund_payouts', 'refund_obligations', 'payment_adjustments', 'payment_allocations', 'payments'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
