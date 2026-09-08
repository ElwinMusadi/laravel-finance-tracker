glob: app/**,database/**,tests/**
title: Finance domain — category-driven model
note: |
  Transactions use category_id + account_id. Do NOT use source_account_id, destination_account_id, AccountTypeMatrix.
  Transfer: category type=transfer, needs distinct transfer_account_id, no contact or action.
  Debt/Receivable: category type=debt|receivable, need contact_id and action from TransactionAction enum.
  Income/Expense: category type=income|expense, no contact or action.
  OpeningBalance: system-only (type=opening_balance), created by AccountController only.
  Budget: stored as categories.budget_limit on expense categories; no separate budgets table records.
  BudgetController routes bind Category model (not Budget). budgets.store route removed.
  LedgerService.getAccountBalance computes sign from category type and action, not account type.
  AccountType is a free-form label; Account no longer has a type, contact_id, or ofType() scope.
  Migration 2026_09_08_153115 is one-way; down() throws RuntimeException.
