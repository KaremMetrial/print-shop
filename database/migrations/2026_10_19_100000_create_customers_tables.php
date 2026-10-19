<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // شرائح الأسعار (تكتمل منطقيًا في المرحلة 3 — هنا الحد الأدنى لربط العميل بالشريحة الافتراضية).
        Schema::create('pricing_tiers', function (Blueprint $t) {
            $t->id();
            $t->string('name', 80)->unique();
            $t->string('mode', 20)->default('PERCENTAGE'); // PERCENTAGE | FIXED_BASE
            $t->decimal('discount_percentage', 5, 2)->nullable();
            $t->boolean('is_default')->default(false);
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
        DB::table('pricing_tiers')->insert(['name' => 'الافتراضية', 'mode' => 'PERCENTAGE', 'discount_percentage' => 0, 'is_default' => true, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);

        Schema::create('customers', function (Blueprint $t) {
            $t->id();
            $t->string('name', 150);
            $t->string('phone_normalized', 20)->unique(); // رقم رئيسي واحد مميز (§32.5)
            $t->string('phone_display', 25);
            $t->string('address', 500)->nullable();
            $t->foreignId('pricing_tier_id')->constrained('pricing_tiers');
            $t->boolean('platform_access_enabled')->default(false);
            $t->string('notification_mode', 20)->default('SYSTEM_DEFAULT'); // SYSTEM_DEFAULT | MANUAL | AUTOMATIC
            $t->text('notes')->nullable();
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
            $t->index('name');
            $t->index('created_at');
        });
        // فهرس FULLTEXT مع ngram للبحث العربي بالاسم (§ ADR-01).
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE customers ADD FULLTEXT customers_name_ft (name) WITH PARSER ngram');
        }

        Schema::create('customer_credentials', function (Blueprint $t) {
            $t->id();
            $t->foreignId('customer_id')->unique()->constrained()->cascadeOnDelete();
            $t->string('password_hash');
            $t->string('status', 10)->default('ACTIVE'); // ACTIVE | DISABLED
            $t->timestamp('password_created_at')->useCurrent();
            $t->timestamp('last_reset_at')->nullable();
            $t->timestamp('last_login_at')->nullable();
            $t->unsignedInteger('session_version')->default(1);
            $t->timestamps();
        });

        Schema::create('password_recovery_requests', function (Blueprint $t) {
            $t->id();
            $t->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $t->string('status', 12)->default('OPEN'); // OPEN | CLAIMED | COMPLETED | CANCELLED
            $t->foreignId('claimed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('claimed_at')->nullable();
            $t->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('completed_at')->nullable();
            $t->timestamp('created_at')->useCurrent();
            $t->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_recovery_requests');
        Schema::dropIfExists('customer_credentials');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('pricing_tiers');
    }
};
