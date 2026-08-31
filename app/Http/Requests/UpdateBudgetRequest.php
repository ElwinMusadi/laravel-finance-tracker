<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBudgetRequest extends FormRequest
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
            'account_id' => [
                'required',
                'integer',
                Rule::exists('accounts', 'id')->where(function ($query) {
                    return $query->where('type', 'expense');
                }),
            ],
            'period_month' => [
                'required',
                'date',
                'date_format:Y-m-d',
                Rule::unique('budgets')->where(function ($query) {
                    return $query->where('account_id', $this->account_id);
                })->ignore($this->route('budget')),
            ],
            'amount' => ['required', 'numeric', 'min:0'],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('period_month') && preg_match('/^\d{4}-\d{2}$/', $this->period_month)) {
            $this->merge([
                'period_month' => $this->period_month.'-01',
            ]);
        }
    }
}
