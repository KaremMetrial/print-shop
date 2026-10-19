<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_chat_messages', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $t->string('sender_type', 10); // staff | customer | link | system
            $t->unsignedBigInteger('sender_id')->nullable();
            $t->string('sender_label', 40)->nullable(); // مصمم | إدارة | عميل
            $t->text('body');
            $t->string('client_message_id', 64); // منع التكرار عند إعادة المحاولة
            $t->timestamp('created_at')->useCurrent();
            $t->unique(['order_item_id', 'client_message_id']);
            $t->index(['order_item_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_chat_messages');
    }
};
