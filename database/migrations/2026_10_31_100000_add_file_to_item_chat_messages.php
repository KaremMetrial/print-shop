<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** مرفق/رسالة صوتية في شات البند (M-B03): رسالة واحدة = نص و/أو ملف. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('item_chat_messages', function (Blueprint $t) {
            $t->foreignId('file_id')->nullable()->after('body')->constrained('files')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('item_chat_messages', function (Blueprint $t) {
            $t->dropConstrainedForeignId('file_id');
        });
    }
};
