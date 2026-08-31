<?php

namespace App\Http\Requests;

use App\Models\Account;
use App\Services\AccountTypeMatrix;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreTransactionRequest extends FormRequest
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
            'transaction_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['required', 'string', 'max:255'],
            'source_account_id' => ['required', 'integer', 'exists:accounts,id'],
            'destination_account_id' => ['required', 'integer', 'exists:accounts,id', 'different:source_account_id'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $sourceId = $this->input('source_account_id');
            $destinationId = $this->input('destination_account_id');

            if ($sourceId && $destinationId) {
                $source = Account::find($sourceId);
                $destination = Account::find($destinationId);

                if ($source && $destination) {
                    $matrix = app(AccountTypeMatrix::class);
                    if (! $matrix->isValidCombination($source->type, $destination->type)) {
                        $validator->errors()->add(
                            'destination_account_id',
                            $matrix->getErrorMessage($source->type, $destination->type)
                        );
                    }
                }
            }
        });
    }
}
