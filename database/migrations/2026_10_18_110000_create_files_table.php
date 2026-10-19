<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->string('storage_key', 255)->unique(); // لا يُرسل أبدًا كرابط عام
            $table->string('disk', 30);
            $table->string('original_filename', 255);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size_bytes');
            $table->string('category', 40);
            $table->string('uploaded_by_type', 20); // staff | customer | link
            $table->unsignedBigInteger('uploaded_by_id')->nullable();
            $table->char('checksum', 64);
            $table->string('parent_type', 100)->nullable(); // يُربط عند الاستخدام الفعلي
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['parent_type', 'parent_id']);
            $table->index(['uploaded_by_type', 'uploaded_by_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};
