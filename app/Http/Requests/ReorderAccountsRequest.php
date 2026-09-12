<?php

namespace App\Http\Requests;

use App\Models\Account;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ReorderAccountsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'account_ids' => ['required', 'array', 'min:1'],
            'account_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists(Account::class, 'id'),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $accountIds = $this->input('account_ids', []);

            if (count($accountIds) !== Account::query()->count()) {
                $validator->errors()->add(
                    'account_ids',
                    'Semua akun harus disertakan saat mengubah urutan.',
                );
            }
        });
    }
}
