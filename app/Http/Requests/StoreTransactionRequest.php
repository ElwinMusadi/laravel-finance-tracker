<?php

namespace App\Http\Requests;

use App\Enums\CategoryType;
use App\Enums\TransactionAction;
use App\Models\Category;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'transaction_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'transfer_account_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'contact_id' => ['nullable', 'integer', 'exists:contacts,id'],
            'action' => ['nullable', Rule::enum(TransactionAction::class)],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $category = Category::find($this->integer('category_id'));

            if ($category === null) {
                return;
            }

            $type = $category->type;
            if ($type->isSystemOnly()) {
                $validator->errors()->add('category_id', 'Kategori saldo awal hanya dapat dibuat oleh sistem.');
            }

            if ($type === CategoryType::Transfer) {
                if (! $this->filled('transfer_account_id')) {
                    $validator->errors()->add('transfer_account_id', 'Akun tujuan transfer wajib diisi.');
                }
                if ($this->integer('account_id') === $this->integer('transfer_account_id')) {
                    $validator->errors()->add('transfer_account_id', 'Akun transfer harus berbeda.');
                }
                if ($this->filled('contact_id') || $this->filled('action')) {
                    $validator->errors()->add('category_id', 'Transfer tidak boleh memiliki kontak atau aksi utang/piutang.');
                }

                return;
            }

            if ($this->filled('transfer_account_id')) {
                $validator->errors()->add('transfer_account_id', 'Hanya kategori transfer yang dapat memiliki akun tujuan.');
            }

            if ($type->requiresContact()) {
                if (! $this->filled('contact_id')) {
                    $validator->errors()->add('contact_id', 'Kontak wajib diisi untuk utang atau piutang.');
                }
                if (! $this->filled('action')) {
                    $validator->errors()->add('action', 'Aksi wajib diisi untuk utang atau piutang.');
                } elseif (! TransactionAction::tryFrom((string) $this->input('action'))?->isValidFor($type)) {
                    $validator->errors()->add('action', 'Aksi tidak sesuai dengan kategori transaksi.');
                }

                return;
            }

            if ($this->filled('contact_id') || $this->filled('action')) {
                $validator->errors()->add('category_id', 'Kategori ini tidak boleh memiliki kontak atau aksi utang/piutang.');
            }
        });
    }
}
