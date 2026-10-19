<?php

namespace App\Enums;

enum Role: string
{
    case SuperAdmin = 'SUPER_ADMIN';
    case Admin = 'ADMIN';
    case DataEntry = 'DATA_ENTRY';
    case Designer = 'DESIGNER';
    case Accountant = 'ACCOUNTANT';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'المدير العام',
            self::Admin => 'مدير',
            self::DataEntry => 'مدخل بيانات',
            self::Designer => 'مصمم',
            self::Accountant => 'محاسب',
        };
    }

    /** مستوى الإدارة: يديره Super Admin فقط (BR-072/073). */
    public function isAdminLevel(): bool
    {
        return $this === self::SuperAdmin || $this === self::Admin;
    }

    /** الواجهة المناسبة للـFrontend (مفتاح navForRole). */
    public function uiKey(): string
    {
        return match ($this) {
            self::SuperAdmin => 'super_admin',
            self::Admin => 'admin',
            self::DataEntry => 'data_entry',
            self::Designer => 'designer',
            self::Accountant => 'accountant',
        };
    }
}
