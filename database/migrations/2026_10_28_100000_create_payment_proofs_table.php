<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_proofs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained('orders');
            $t->foreignId('customer_id')->constrained('customers');
            $t->foreignId('file_id')->constrained('files');
            $t->unsignedBigInteger('claimed_amount'); // قروش — ما يدّعيه العميل، ليس دفعة مؤكدة
            $t->string('method', 20);
            $t->string('reference', 100)->nullable();
            $t->string('status', 10)->default('PENDING'); // PENDING | APPROVED | REJECTED
            $t->string('submitted_by_type', 10); // link | customer
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('reviewed_at')->nullable();
            $t->string('reject_reason', 255)->nullable();
            $t->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $t->timestamps();
            $t->index(['status', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_proofs');
    }
};
