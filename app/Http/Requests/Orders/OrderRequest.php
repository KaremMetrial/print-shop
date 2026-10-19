<?php

namespace App\Http\Requests\Orders;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->hasPermission('orders.create');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'delivery_method' => ['required', Rule::in(['PICKUP', 'DELIVERY'])],
            'delivery_address' => ['nullable', 'string', 'max:500'],
            'delivery_fee' => ['nullable', 'integer', 'min:0'],
            'printing_eta_days' => ['nullable', 'integer', 'min:1', 'max:60'],
            'discount_type' => ['nullable', Rule::in(['NONE', 'FIXED', 'PERCENT'])],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
            'items.*.options' => ['nullable', 'array'],
            'items.*.options.*' => ['array'],
            'items.*.options.*.*' => ['integer'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['items.required' => 'أضف بندًا واحدًا على الأقل.', 'items.min' => 'أضف بندًا واحدًا على الأقل.', 'customer_id.required' => 'اختر العميل.'];
    }
}
