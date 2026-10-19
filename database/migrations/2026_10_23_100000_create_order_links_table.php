<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_links', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->unique()->constrained()->cascadeOnDelete(); // رابط واحد لأوردر واحد (BR-005)
            $t->char('token_hash', 64)->unique(); // البحث بالـhash فقط
            $t->text('token_encrypted'); // لنسخ الرابط للموظف (S-017) — مشفّر، لا يُرسل للعميل
            $t->string('status', 10)->default('ACTIVE'); // ACTIVE | SUSPENDED | CLOSED
            $t->timestamp('last_regenerated_at')->nullable();
            $t->timestamp('suspended_at')->nullable();
            $t->timestamp('closed_at')->nullable();
            $t->timestamp('last_access_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_links');
    }
};
