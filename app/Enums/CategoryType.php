<?php

namespace App\Enums;

enum CategoryType: string
{
    case Income = 'income';
    case Expense = 'expense';
    case Debt = 'debt';
    case Receivable = 'receivable';
    case Transfer = 'transfer';
    case OpeningBalance = 'opening_balance';

    public function requiresContact(): bool
    {
        return in_array($this, [self::Debt, self::Receivable], true);
    }

    public function supportsBudget(): bool
    {
        return $this === self::Expense;
    }

    public function isSystemOnly(): bool
    {
        return $this === self::OpeningBalance;
    }
}
