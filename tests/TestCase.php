<?php

namespace Tests;

use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** الأدوار والصلاحيات بنية أساسية: تُزرع داخل معاملة كل اختبار يستعمل RefreshDatabase. */
    protected function setUp(): void
    {
        parent::setUp();

        if (in_array(RefreshDatabase::class, class_uses_recursive($this), true)) {
            $this->seed(RbacSeeder::class);
        }
    }
}
