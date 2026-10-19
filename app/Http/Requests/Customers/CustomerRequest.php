<?php

namespace App\Http\Requests\Customers;

use App\Enums\NotificationMode;
use App\Models\Customer;
use App\Models\PricingTier;
use App\Support\PhoneNormalizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class CustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        $c = $this->route('customer');

        return $c instanceof Customer ? Gate::forUser($this->user())->allows('update', $c) : Gate::forUser($this->user())->allows('create', Customer::class);
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['phone_normalized' => PhoneNormalizer::normalize($this->input('phone'))]);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $current = $this->route('customer');

        return [
            'name' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:30'],
            'phone_normalized' => ['required', 'string', Rule::unique(Customer::class, 'phone_normalized')->ignore($current?->id)],
            'address' => ['nullable', 'string', 'max:500'],
            'pricing_tier_id' => ['nullable', Rule::exists(PricingTier::class, 'id')->where('is_active', true)],
            'notification_mode' => ['nullable', Rule::enum(NotificationMode::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم العميل مطلوب.',
            'phone.required' => 'رقم الهاتف مطلوب.',
            'phone_normalized.required' => 'رقم الهاتف غير صالح.',
            'phone_normalized.unique' => 'رقم الهاتف مسجل بالفعل لعميل آخر.',
            'pricing_tier_id.exists' => 'شريحة السعر غير موجودة أو غير نشطة.',
        ];
    }
}
