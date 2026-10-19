<?php

use App\Http\Controllers\Catalog\OptionGroupController;
use App\Http\Controllers\Catalog\PricingQuoteController;
use App\Http\Controllers\Catalog\ProductController;
use App\Http\Controllers\Catalog\TierController;
use App\Http\Controllers\Chat\StaffChatController;
use App\Http\Controllers\Customers\CustomerAccessController;
use App\Http\Controllers\Customers\CustomerActivityController;
use App\Http\Controllers\Customers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Design\ManagementController;
use App\Http\Controllers\Designer\TaskController;
use App\Http\Controllers\Employees\EmployeeController;
use App\Http\Controllers\Files\FileController;
use App\Http\Controllers\Link\PublicLinkController;
use App\Http\Controllers\Notifications\NotificationController;
use App\Http\Controllers\Operations\AccountingController;
use App\Http\Controllers\Operations\AuditController;
use App\Http\Controllers\Operations\DeliveryController;
use App\Http\Controllers\Operations\ReportsController;
use App\Http\Controllers\Operations\SearchController;
use App\Http\Controllers\Operations\SettingsController;
use App\Http\Controllers\Orders\OrderController;
use App\Http\Controllers\Orders\OrderItemController;
use App\Http\Controllers\Orders\OrderLinkController;
use App\Http\Controllers\Orders\OrderRequestController;
use App\Http\Controllers\Portal\PortalAuthController;
use App\Http\Controllers\Portal\PortalController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::prefix('customers')->name('customers.')->group(function () {
        $c = CustomerController::class;
        Route::get('/', [$c, 'index'])->name('index');
        Route::get('create', [$c, 'create'])->name('create');
        Route::get('check-phone', [$c, 'checkPhone'])->name('check-phone');
        Route::post('/', [$c, 'store'])->name('store');
        Route::get('{customer}', [$c, 'show'])->name('show');
        Route::get('{customer}/edit', [$c, 'edit'])->name('edit');
        Route::patch('{customer}', [$c, 'update'])->name('update');
        Route::get('{customer}/access', [CustomerAccessController::class, 'show'])->name('access');
        Route::post('{customer}/access/enable', [CustomerAccessController::class, 'enable'])->name('access.enable');
        Route::post('{customer}/access/disable', [CustomerAccessController::class, 'disable'])->name('access.disable');
        Route::post('{customer}/access/reset-password', [CustomerAccessController::class, 'resetPassword'])->name('access.reset');
        Route::get('{customer}/activity', CustomerActivityController::class)->name('activity');
    });

    Route::prefix('products')->name('products.')->group(function () {
        $c = ProductController::class;
        $o = OptionGroupController::class;
        Route::get('/', [$c, 'index'])->name('index');
        Route::get('create', [$c, 'create'])->name('create');
        Route::post('/', [$c, 'store'])->name('store');
        Route::get('{product}/edit', [$c, 'edit'])->name('edit');
        Route::patch('{product}', [$c, 'update'])->name('update');
        Route::get('{product}/specs', [$c, 'specs'])->name('specs');
        Route::get('{product}/pricing', [$c, 'pricing'])->name('pricing');
        Route::patch('{product}/pricing', [$c, 'updatePricing'])->name('pricing.update');
        Route::get('{product}/routing', [$c, 'routing'])->name('routing');
        Route::patch('{product}/routing', [$c, 'updateRouting'])->name('routing.update');
        Route::get('{product}/activity', [$c, 'activity'])->name('activity');
        Route::post('{product}/toggle', [$c, 'toggle'])->name('toggle');
        Route::get('{product}/options/create', [$o, 'edit'])->name('options.create');
        Route::get('{product}/options/{group}/edit', [$o, 'edit'])->name('options.edit');
        Route::post('{product}/options', [$o, 'save'])->name('options.store');
        Route::patch('{product}/options/{group}', [$o, 'save'])->name('options.update');
    });

    Route::prefix('pricing')->name('tiers.')->group(function () {
        $t = TierController::class;
        Route::get('/', [$t, 'index'])->name('index');
        Route::get('create', [$t, 'create'])->name('create');
        Route::post('/', [$t, 'save'])->name('store');
        Route::get('{tier}/edit', [$t, 'edit'])->name('edit');
        Route::patch('{tier}', [$t, 'save'])->name('update');
    });
    Route::prefix('orders')->name('orders.')->controller(OrderController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('create', 'create')->name('create');
        Route::get('customer-search', 'customerSearch')->name('customer-search');
        Route::post('/', 'store')->name('store')->middleware('idempotent');
        Route::get('{order}', 'show')->name('show');
        Route::get('{order}/edit', 'edit')->name('edit');
        Route::patch('{order}', 'update')->name('update')->middleware('idempotent');
        Route::post('{order}/{step}', 'advance')->whereIn('step', ['complete-printing', 'out-for-delivery', 'complete'])->name('advance')->middleware('idempotent');
        Route::get('{order}/link', [OrderLinkController::class, 'show'])->name('link');
        Route::post('{order}/link/{action}', [OrderLinkController::class, 'act'])->whereIn('action', ['regenerate', 'suspend', 'reactivate'])->name('link.act')->middleware('idempotent');
        Route::get('{order}/items/{item}', [OrderItemController::class, 'show'])->name('items.show');
        Route::get('{order}/job-ticket', [OrderItemController::class, 'jobTicket'])->name('job-ticket');
        Route::get('{order}/job-ticket/pdf', [OrderItemController::class, 'jobTicketPdf'])->name('job-ticket.pdf');
        Route::post('{order}/items', 'addItem')->name('items.add')->middleware('idempotent');
        Route::post('{order}/items/{item}/cancel', 'cancelItem')->name('items.cancel')->middleware('idempotent');
        Route::post('{order}/cancel', 'cancel')->name('cancel')->middleware('idempotent');
    });

    Route::prefix('order-requests')->name('order-requests.')->controller(OrderRequestController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('{orderRequest}', 'show')->name('show');
        Route::post('{orderRequest}/start', 'start')->name('start')->middleware('idempotent');
        Route::patch('{orderRequest}', 'save')->name('save')->middleware('idempotent');
        Route::post('{orderRequest}/accept', 'accept')->name('accept')->middleware('idempotent');
        Route::post('{orderRequest}/reject', 'reject')->name('reject')->middleware('idempotent');
    });

    Route::controller(NotificationController::class)->group(function () {
        Route::get('notifications', 'index')->name('notifications.index');
        Route::post('notifications/read-all', 'readAll')->name('notifications.read-all');
        Route::post('notifications/{id}/read', 'read')->name('notifications.read');
        Route::get('actions', 'actions')->name('actions.index');
        Route::get('actions/log', 'log')->name('actions.log');
        Route::post('actions/{id}/claim', 'claim')->name('actions.claim')->middleware('idempotent');
        Route::post('actions/{id}/complete', 'complete')->name('actions.complete')->middleware('idempotent');
    });

    Route::get('audit', [AuditController::class, 'index'])->name('audit.index');
    Route::get('delivery', [DeliveryController::class, 'index'])->name('delivery.index');
    Route::get('search', SearchController::class)->name('search');
    Route::get('reports', ReportsController::class)->name('reports');
    Route::get('settings/system', [SettingsController::class, 'index'])->name('settings.system');
    Route::patch('settings/system', [SettingsController::class, 'update'])->name('settings.system.update');
    Route::prefix('accounting')->name('accounting.')->controller(AccountingController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('payments', 'store')->name('payments.store')->middleware('idempotent');
        Route::post('payments/{payment}/correct', 'correct')->name('payments.correct')->middleware('idempotent');
        Route::post('payments/{payment}/void', 'void')->name('payments.void')->middleware('idempotent');
        Route::post('refunds/{id}/payout', 'payout')->name('refunds.payout')->middleware('idempotent');
    });

    Route::get('chat/items/{item}', [StaffChatController::class, 'index'])->name('chat.index');
    Route::post('chat/items/{item}', [StaffChatController::class, 'store'])->name('chat.store');

    Route::prefix('design')->name('design.')->controller(ManagementController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('items/{item}/assign', 'assign')->name('assign')->middleware('idempotent');
        Route::get('designers', 'designers')->name('designers');
        Route::get('designers/{designer}', 'designer')->name('designer');
        Route::post('designers/{designer}/availability', 'availability')->name('availability')->middleware('idempotent');
    });

    Route::prefix('designer')->name('designer.')->controller(TaskController::class)->group(function () {
        Route::get('tasks', 'index')->name('tasks');
        Route::get('tasks/{item}', 'show')->name('tasks.show');
        Route::post('tasks/{item}/start', 'start')->name('tasks.start')->middleware('idempotent');
        Route::get('tasks/{item}/versions/new', 'newVersion')->name('versions.new');
        Route::get('versions/{version}', 'editVersion')->name('versions.edit');
        Route::put('versions/{version}', 'saveVersion')->name('versions.save')->middleware('idempotent');
    });

    Route::post('pricing/quote', PricingQuoteController::class)->name('pricing.quote');

    Route::prefix('employees')->name('employees.')->controller(EmployeeController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('create', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('{employee}', 'show')->name('show');
        Route::get('{employee}/edit', 'edit')->name('edit');
        Route::patch('{employee}', 'update')->name('update');
        Route::post('{employee}/deactivate', 'deactivate')->name('deactivate');
        Route::post('{employee}/activate', 'activate')->name('activate');
        Route::post('{employee}/reset-password', 'resetPassword')->name('reset-password');
        Route::get('{employee}/permissions', 'permissionsPage')->name('permissions.edit');
        Route::put('{employee}/permissions', 'permissions')->name('permissions');
    });

    Route::post('files', [FileController::class, 'store'])->name('files.store');
    Route::get('files/{file}/preview', [FileController::class, 'preview'])->name('files.preview');
    Route::get('files/{file}/download', [FileController::class, 'download'])->name('files.download');

    Route::get('dashboard', DashboardController::class)->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/dev.php';

// رابط عميل الأوردر (بدون تسجيل دخول): throttle + لا فهرسة
Route::prefix('l/{token}')->middleware(['throttle:link-access'])->name('link.')->controller(PublicLinkController::class)->group(function () {
    Route::get('/', 'show')->name('show');
    Route::get('items/{item}', 'item')->name('item');
    Route::post('items/{item}/approve', 'approve')->name('approve');
    Route::get('files/{file}', 'file')->name('file');
    Route::match(['get', 'post'], 'items/{item}/chat', 'chat')->name('chat');
});

// بوابة العميل المسجّل (جلسة منفصلة)
Route::prefix('portal')->name('portal.')->group(function () {
    Route::controller(PortalAuthController::class)->group(function () {
        Route::get('login', 'login')->name('login');
        Route::post('login', 'store')->name('login.store')->middleware('throttle:20,1');
        Route::get('recover', 'recover')->name('recover');
        Route::post('recover', 'recoverStore')->name('recover.store')->middleware('throttle:20,1');
    });
    Route::middleware('portal')->group(function () {
        Route::post('logout', [PortalAuthController::class, 'logout'])->name('logout');
        Route::controller(PortalController::class)->group(function () {
            Route::get('/', 'dashboard')->name('home');
            Route::get('requests', 'requests')->name('requests');
            Route::get('requests/new', 'createRequest')->name('requests.new');
            Route::post('requests/quote', 'quote')->name('requests.quote');
            Route::post('requests', 'storeRequest')->name('requests.store')->middleware('idempotent');
            Route::get('requests/{orderRequest}', 'showRequest')->name('requests.show');
            Route::get('orders', 'orders')->name('orders');
            Route::get('orders/{order}', 'showOrder')->name('orders.show');
            Route::get('orders/{order}/items/{item}', 'item')->name('orders.item');
            Route::post('orders/{order}/items/{item}/approve', 'approve')->name('orders.approve')->middleware('idempotent');
            Route::get('files/{file}', 'file')->name('files');
            Route::match(['get', 'post'], 'orders/{order}/items/{item}/chat', 'chat')->name('orders.chat');
            Route::get('account', 'account')->name('account');
        });
    });
});
