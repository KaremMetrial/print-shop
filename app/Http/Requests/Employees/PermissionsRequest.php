<?php

namespace App\Http\Requests\Employees;

use App\Support\Auth\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class PermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::forUser($this->user())->allows('managePermissions', $this->route('employee'));
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $in = Rule::in(Permissions::all());

        return [
            'grant' => ['present', 'array'], 'grant.*' => ['string', $in],
            'revoke' => ['present', 'array'], 'revoke.*' => ['string', $in],
        ];
    }
}
