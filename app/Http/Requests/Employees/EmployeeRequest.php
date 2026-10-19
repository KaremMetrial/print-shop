<?php

namespace App\Http\Requests\Employees;

use App\Enums\DesignerAvailability;
use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class EmployeeRequest extends FormRequest
{
    /** التفويض قبل التحقق من المدخلات: لا نكشف أخطاء الحقول لمن لا يملك الصلاحية أصلًا. */
    public function authorize(): bool
    {
        $actor = $this->user();
        $target = $this->route('employee');

        if ($target instanceof User) {
            return Gate::forUser($actor)->allows('update', $target);
        }
        $role = Role::tryFrom((string) $this->input('role'));

        return $role
            ? Gate::forUser($actor)->allows('create', [User::class, $role])
            : $actor->hasPermission('employees.manage_staff') || $actor->hasPermission('employees.manage_admins');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $target = $this->route('employee');
        $isCreate = $target === null;

        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:190', Rule::unique(User::class, 'email')->ignore($target?->id)],
            'phone' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\s-]{7,20}$/'],
            // SUPER_ADMIN ليس خيارًا أبدًا: لا يُنشأ من الواجهة.
            'role' => [$isCreate ? 'required' : 'sometimes', Rule::enum(Role::class)->except([Role::SuperAdmin])],
            'password' => [$isCreate ? 'required' : 'prohibited', Password::min(10)->letters()->numbers()],
            // إعدادات المصمم تظهر وتُطلب فقط عند الدور «مصمم»
            'specialty_ids' => [Rule::requiredIf($this->isDesigner($target)), 'array', 'min:'.($this->isDesigner($target) ? 1 : 0)],
            'specialty_ids.*' => [Rule::exists('designer_specialties', 'id')->where('is_active', true)],
            'availability' => ['nullable', Rule::enum(DesignerAvailability::class)],
        ];
    }

    public function attributes(): array
    {
        return ['name' => 'الاسم', 'email' => 'البريد الإلكتروني', 'phone' => 'الهاتف', 'role' => 'الدور', 'password' => 'كلمة المرور', 'specialty_ids' => 'التخصصات', 'availability' => 'حالة التوفر'];
    }

    private function isDesigner(?User $target): bool
    {
        $role = $this->input('role') ?? $target?->roleEnum()?->value;

        return $role === Role::Designer->value;
    }
}
