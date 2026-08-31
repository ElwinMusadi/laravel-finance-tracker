<?php

namespace App\Http\Requests;

use App\Models\Account;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAccountRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', Rule::in(['asset', 'liability', 'equity', 'revenue', 'expense'])],
            'contact_id' => [
                'nullable',
                Rule::when(
                    in_array($this->input('type'), ['asset', 'liability'], true),
                    ['integer', 'exists:contacts,id'],
                    ['prohibited'] // cannot link a contact to equity, revenue, or expense
                ),
            ],
            'icon' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'opening_balance' => [
                'nullable',
                Rule::when($this->input('type') === 'asset', ['numeric', 'min:0']),
            ],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($this->filled('contact_id') && $this->filled('type')) {
                $exists = Account::where('contact_id', $this->input('contact_id'))
                    ->where('type', $this->input('type'))
                    ->exists();

                if ($exists) {
                    $validator->errors()->add(
                        'contact_id',
                        'This contact already has an account of this type.'
                    );
                }
            }
        });
    }
}
