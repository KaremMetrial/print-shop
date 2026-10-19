<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// معرض المكونات — للتطوير فقط (مقارنة بصرية مع pendev/untitled.pen)
if (app()->environment('local')) {
    Route::middleware('auth')->get('dev/components', fn () => Inertia::render('dev/components'))->name('dev.components');
}

if (app()->environment('local')) {
    Route::get('dev/pen/{screen}', fn (string $screen) => Inertia::render('dev/pen', ['screen' => $screen]))->where('screen', '[A-Za-z0-9_-]+');
}
