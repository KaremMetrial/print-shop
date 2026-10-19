<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('design_versions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $t->unsignedSmallInteger('version_no');
            $t->string('status', 12)->default('DRAFT'); // DRAFT | SUBMITTED | APPROVED | SUPERSEDED
            $t->unsignedInteger('manifest_revision')->default(1); // يزيد مع كل تغيير في الملفات (فحص stale)
            $t->text('notes')->nullable();
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('submitted_at')->nullable();
            $t->timestamp('approved_at')->nullable();
            $t->string('approved_by_type', 12)->nullable(); // customer | link | staff
            $t->unsignedBigInteger('approved_by_id')->nullable();
            $t->timestamps();
            $t->unique(['order_item_id', 'version_no']);
        });
        Schema::create('design_version_files', function (Blueprint $t) {
            $t->id();
            $t->foreignId('design_version_id')->constrained()->cascadeOnDelete();
            $t->foreignId('file_id')->constrained('files');
            $t->unsignedSmallInteger('sort_order')->default(0);
            $t->unique(['design_version_id', 'file_id']);
        });
        Schema::create('design_events', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $t->foreignId('design_version_id')->nullable()->constrained()->nullOnDelete();
            $t->string('type', 40); // started | version_created | files_changed | submitted | approved | reopened | revision_requested
            $t->string('actor_type', 12)->nullable();
            $t->unsignedBigInteger('actor_id')->nullable();
            $t->text('note')->nullable();
            $t->timestamp('created_at')->useCurrent();
            $t->index(['order_item_id', 'id']);
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE design_versions ADD CONSTRAINT chk_dv_status CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','SUPERSEDED'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('design_events');
        Schema::dropIfExists('design_version_files');
        Schema::dropIfExists('design_versions');
    }
};
