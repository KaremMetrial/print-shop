<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // إشعارات داخل النظام فقط للموظفين (BR-065): قراءتها لا تُغلق أي إجراء (BR-066)
        Schema::create('staff_notifications', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $t->string('type', 40);
            $t->string('title', 150);
            $t->text('body')->nullable();
            $t->string('link', 255)->nullable();
            $t->foreignId('action_id')->nullable();
            $t->timestamp('read_at')->nullable();
            $t->timestamp('created_at')->useCurrent();
            $t->index(['user_id', 'read_at', 'id']);
        });
        // مركز الإجراءات: عملية مطلوبة تبقى مفتوحة حتى تُنفَّذ فعلًا
        Schema::create('staff_actions', function (Blueprint $t) {
            $t->id();
            $t->string('type', 40); // ORDER_REQUEST | PASSWORD_RECOVERY | ASSIGN_DESIGNER | CUSTOMER_NOTICE | OTHER
            $t->string('title', 180);
            $t->string('customer', 150)->nullable();
            $t->string('order_ref', 30)->nullable();
            $t->string('link', 255)->nullable();
            $t->string('dedupe_key', 120)->unique(); // لا إجراءان لنفس الحدث
            $t->string('status', 10)->default('OPEN'); // OPEN | CLAIMED | DONE
            $t->foreignId('claimed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('claimed_at')->nullable();
            $t->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('completed_at')->nullable();
            $t->string('completed_note', 255)->nullable();
            $t->timestamps();
            $t->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_actions');
        Schema::dropIfExists('staff_notifications');
    }
};
