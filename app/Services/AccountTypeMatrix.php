<?php

namespace App\Services;

/**
 * Validates Source → Destination account type combinations.
 *
 * Only domain-valid financial flows are permitted:
 *
 * | Scenario             | Source Type | Destination Type |
 * |----------------------|------------|------------------|
 * | Opening Balance      | equity     | asset            |
 * | Income               | revenue    | asset            |
 * | Expense              | asset      | expense          |
 * | Transfer             | asset      | asset            |
 * | Borrowing (Debt)     | liability  | asset            |
 * | Debt Repayment       | asset      | liability        |
 * | Lending (Receivable) | asset      | asset            |
 * | Receivable Repayment | asset      | asset            |
 */
class AccountTypeMatrix
{
    /**
     * Valid source_type => [allowed destination_types].
     *
     * @var array<string, list<string>>
     */
    private const VALID_COMBINATIONS = [
        'equity' => ['asset'],
        'revenue' => ['asset'],
        'asset' => ['asset', 'expense', 'liability'],
        'liability' => ['asset'],
    ];

    /**
     * Check if the given source and destination account types form a valid financial flow.
     */
    public function isValidCombination(string $sourceType, string $destinationType): bool
    {
        $allowedDestinations = self::VALID_COMBINATIONS[$sourceType] ?? [];

        return in_array($destinationType, $allowedDestinations, true);
    }

    /**
     * Get all valid destination types for a given source type.
     *
     * @return list<string>
     */
    public function getAllowedDestinations(string $sourceType): array
    {
        return self::VALID_COMBINATIONS[$sourceType] ?? [];
    }

    /**
     * Get a human-readable error message for an invalid combination.
     */
    public function getErrorMessage(string $sourceType, string $destinationType): string
    {
        return "Invalid transaction: cannot move funds from {$sourceType} account to {$destinationType} account.";
    }
}
