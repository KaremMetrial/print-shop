<?php

namespace App\Providers;

use App\Events\OutboxEventPublished;
use App\Listeners\AssignDesignersOnOrderCreated;
use App\Models\Product;
use App\Models\User;
use App\Policies\CatalogPolicy;
use App\Policies\EmployeePolicy;
use App\Services\Files\FileAccessRegistry;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(FileAccessRegistry::class);
        $this->app->afterResolving(FileAccessRegistry::class, function (FileAccessRegistry $r) {
            // ملفات النسخ: المصمم المسند، أو موظف يملك صلاحية ملفات الأوردر (BR-071: مصمم غير مسند لا يرى)
            $r->register('design_version', function ($file, $actor) {
                if (! $actor instanceof User) {
                    return false;
                }
                $item = DB::table('design_versions')->join('order_items', 'order_items.id', '=', 'design_versions.order_item_id')->where('design_versions.id', $file->parent_id)->first(['order_items.designer_id']);

                return $item && ($item->designer_id === $actor->id || $actor->hasPermission('orders.files.view'));
            });
        });
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // أي ability بصيغة permission (module.action) تُحسم من RBAC؛ غيرها يمر للـPolicies.
        Gate::before(function ($user, string $ability) {
            if ($user instanceof User && str_contains($ability, '.')) {
                return $user->hasPermission($ability);
            }

            return null;
        });
        RateLimiter::for('link-access', fn (Request $r) => Limit::perMinute(60)->by($r->ip().'|'.substr(hash('sha256', (string) $r->route('token')), 0, 12)));
        Gate::policy(User::class, EmployeePolicy::class);
        Gate::policy(Product::class, CatalogPolicy::class);
        Event::listen(OutboxEventPublished::class, AssignDesignersOnOrderCreated::class);
    }
}
