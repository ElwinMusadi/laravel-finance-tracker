<?php

namespace App\Enums;

enum TransactionAction: string
{
    case ReceiveLoan = 'receive_loan';
    case RepayDebt = 'repay_debt';
    case GiveLoan = 'give_loan';
    case ReceiveRepayment = 'receive_repayment';

    public function isValidFor(CategoryType $categoryType): bool
    {
        return match ($categoryType) {
            CategoryType::Debt => in_array($this, [self::ReceiveLoan, self::RepayDebt], true),
            CategoryType::Receivable => in_array($this, [self::GiveLoan, self::ReceiveRepayment], true),
            default => false,
        };
    }
}
