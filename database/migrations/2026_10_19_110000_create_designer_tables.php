<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('designer_specialties', function (Blueprint $t) {
            $t->id();
            $t->string('name', 80)->unique();
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
        Schema::create('designer_specialty_memberships', function (Blueprint $t) {
            $t->foreignId('designer_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('specialty_id')->constrained('designer_specialties')->cascadeOnDelete();
            $t->primary(['designer_id', 'specialty_id']);
        });
        // حالة استقبال المهام مستقلة عن تسجيل الدخول (§9.6)
        Schema::create('designer_availability', function (Blueprint $t) {
            $t->foreignId('designer_id')->primary()->constrained('users')->cascadeOnDelete();
            $t->string('status', 12)->default('AVAILABLE'); // AVAILABLE | UNAVAILABLE | ON_LEAVE
            $t->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('updated_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('designer_availability');
        Schema::dropIfExists('designer_specialty_memberships');
        Schema::dropIfExists('designer_specialties');
    }
};
