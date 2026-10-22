<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $t) {
            $t->id();
            $t->string('number', 20)->nullable()->unique(); // INV-0001
            $t->foreignId('order_id')->constrained('orders');
            $t->foreignId('customer_id')->constrained('customers');
            $t->unsignedBigInteger('active_order_id')->nullable()->unique(); // = order_id وهي سارية فقط → فاتورة سارية واحدة لكل أوردر
            $t->string('status', 10)->default('ISSUED'); // ISSUED | VOIDED
            $t->json('snapshot'); // لقطة ثابتة: العميل/البنود/المبالغ/المدفوع وقت الإصدار (لا تتغير لاحقًا)
            $t->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('issued_at')->useCurrent();
            $t->text('void_reason')->nullable();
            $t->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('voided_at')->nullable();
            $t->timestamps();
            $t->index(['status', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
