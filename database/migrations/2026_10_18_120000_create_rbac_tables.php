<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $t) {
            $t->id();
            $t->string('code', 30)->unique();
            $t->string('name', 60);
            $t->boolean('is_system_role')->default(true);
            $t->timestamps();
        });
        Schema::create('permissions', function (Blueprint $t) {
            $t->id();
            $t->string('code', 80)->unique();
            $t->string('module', 30)->index();
            $t->string('description', 150);
            $t->timestamps();
        });
        Schema::create('role_permissions', function (Blueprint $t) {
            $t->foreignId('role_id')->constrained()->cascadeOnDelete();
            $t->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $t->primary(['role_id', 'permission_id']);
        });
        Schema::create('user_permission_overrides', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $t->boolean('granted');
            $t->foreignId('granted_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('granted_at')->useCurrent();
            $t->unique(['user_id', 'permission_id']);
        });
        Schema::table('users', function (Blueprint $t) {
            $t->foreignId('role_id')->nullable()->after('password')->constrained('roles');
            $t->string('status', 10)->default('ACTIVE')->after('role_id')->index();
            $t->string('phone', 20)->nullable()->after('email');
            $t->timestamp('last_login_at')->nullable();
            $t->unsignedInteger('session_version')->default(1);
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->dropConstrainedForeignId('created_by');
            $t->dropConstrainedForeignId('role_id');
            $t->dropColumn(['status', 'phone', 'last_login_at', 'session_version']);
        });
        Schema::dropIfExists('user_permission_overrides');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
