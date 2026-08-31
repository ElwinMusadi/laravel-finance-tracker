<?php

use App\Models\Account;
use App\Models\Contact;
use App\Models\Transaction;
use App\Services\LedgerService;
use Illuminate\Support\Carbon;

beforeEach(function () {
    $this->ledger = app(LedgerService::class);
    $this->equity = Account::factory()->equity()->create(['name' => 'Opening Balance']);
    $this->bank = Account::factory()->asset()->create(['name' => 'Bank BCA']);
    $this->cash = Account::factory()->asset()->create(['name' => 'Cash']);
    $this->salary = Account::factory()->revenue()->create(['name' => 'Salary']);
    $this->food = Account::factory()->expense()->create(['name' => 'Food']);
});

describe('balance calculation', function () {
    it('calculates zero balance for new account', function () {
        expect($this->ledger->getAccountBalance($this->bank))->toBe('0.00');
    });

    it('calculates positive balance after income', function () {
        Transaction::factory()->create([
            'source_account_id' => $this->salary->id,
            'destination_account_id' => $this->bank->id,
            'amount' => 5000000.00,
            'transaction_date' => now(),
            'description' => 'Monthly salary',
        ]);

        expect($this->ledger->getAccountBalance($this->bank))->toBe('5000000.00');
    });

    it('calculates balance after income and expense', function () {
        Transaction::factory()->create([
            'source_account_id' => $this->salary->id,
            'destination_account_id' => $this->bank->id,
            'amount' => 5000000.00,
            'transaction_date' => now(),
            'description' => 'Salary',
        ]);

        Transaction::factory()->create([
            'source_account_id' => $this->bank->id,
            'destination_account_id' => $this->food->id,
            'amount' => 1350000.00,
            'transaction_date' => now(),
            'description' => 'Groceries',
        ]);

        expect($this->ledger->getAccountBalance($this->bank))->toBe('3650000.00');
    });

    it('calculates total asset balance across multiple accounts', function () {
        Transaction::factory()->create([
            'source_account_id' => $this->equity->id,
            'destination_account_id' => $this->bank->id,
            'amount' => 3000000.00,
            'transaction_date' => now(),
            'description' => 'Opening BCA',
        ]);

        Transaction::factory()->create([
            'source_account_id' => $this->equity->id,
            'destination_account_id' => $this->cash->id,
            'amount' => 500000.00,
            'transaction_date' => now(),
            'description' => 'Opening Cash',
        ]);

        expect($this->ledger->getTotalAssetBalance())->toBe('3500000.00');
    });
});

describe('opening balance', function () {
    it('creates opening balance as equity → asset transaction', function () {
        Transaction::factory()->create([
            'source_account_id' => $this->equity->id,
            'destination_account_id' => $this->bank->id,
            'amount' => 10000000.00,
            'transaction_date' => now(),
            'description' => 'Opening balance',
        ]);

        expect($this->ledger->getAccountBalance($this->bank))->toBe('10000000.00');
        expect($this->ledger->getAccountBalance($this->equity))->toBe('-10000000.00');
    });
});

describe('transfer preserves total assets', function () {
    it('does not change total asset balance on transfer', function () {
        Transaction::factory()->create([
            'source_account_id' => $this->equity->id,
            'destination_account_id' => $this->bank->id,
            'amount' => 5000000.00,
            'transaction_date' => now(),
            'description' => 'Opening',
        ]);

        $totalBefore = $this->ledger->getTotalAssetBalance();

        Transaction::factory()->create([
            'source_account_id' => $this->bank->id,
            'destination_account_id' => $this->cash->id,
            'amount' => 2000000.00,
            'transaction_date' => now(),
            'description' => 'Transfer to cash',
        ]);

        $totalAfter = $this->ledger->getTotalAssetBalance();

        expect($totalAfter)->toBe($totalBefore);
        expect($this->ledger->getAccountBalance($this->bank))->toBe('3000000.00');
        expect($this->ledger->getAccountBalance($this->cash))->toBe('2000000.00');
    });
});

describe('debt and receivable', function () {
    it('tracks debt balance correctly', function () {
        $contact = Contact::factory()->create(['name' => 'Budi']);
        $debtAccount = Account::factory()->liability()->create([
            'name' => 'Utang Budi',
            'contact_id' => $contact->id,
        ]);

        // Borrowing: Liability → Asset (we receive cash)
        Transaction::factory()->create([
            'source_account_id' => $debtAccount->id,
            'destination_account_id' => $this->cash->id,
            'amount' => 1000000.00,
            'transaction_date' => now(),
            'description' => 'Borrowed from Budi',
        ]);

        expect($this->ledger->getAccountBalance($debtAccount))->toBe('-1000000.00');
        expect($this->ledger->getAccountBalance($this->cash))->toBe('1000000.00');
    });

    it('tracks receivable balance correctly', function () {
        $contact = Contact::factory()->create(['name' => 'Andi']);
        $receivableAccount = Account::factory()->asset()->create([
            'name' => 'Piutang Andi',
            'contact_id' => $contact->id,
        ]);

        // Lending: Asset (Cash) → Asset (Receivable)
        Transaction::factory()->create([
            'source_account_id' => $this->cash->id,
            'destination_account_id' => $receivableAccount->id,
            'amount' => 500000.00,
            'transaction_date' => now(),
            'description' => 'Lent to Andi',
        ]);

        expect($this->ledger->getAccountBalance($receivableAccount))->toBe('500000.00');
        expect($this->ledger->getAccountBalance($this->cash))->toBe('-500000.00');
    });

    it('handles partial repayment of debt', function () {
        $contact = Contact::factory()->create(['name' => 'Cici']);
        $debtAccount = Account::factory()->liability()->create([
            'name' => 'Utang Cici',
            'contact_id' => $contact->id,
        ]);

        // Borrow 1M
        Transaction::factory()->create([
            'source_account_id' => $debtAccount->id,
            'destination_account_id' => $this->cash->id,
            'amount' => 1000000.00,
            'transaction_date' => now(),
            'description' => 'Borrow',
        ]);

        // Repay 400K: Asset → Liability
        Transaction::factory()->create([
            'source_account_id' => $this->cash->id,
            'destination_account_id' => $debtAccount->id,
            'amount' => 400000.00,
            'transaction_date' => now(),
            'description' => 'Partial repayment',
        ]);

        // Outstanding = -1000000 + 400000 = -600000
        expect($this->ledger->getAccountBalance($debtAccount))->toBe('-600000.00');
    });

    it('handles partial repayment of receivable', function () {
        $contact = Contact::factory()->create(['name' => 'Dodi']);
        $receivableAccount = Account::factory()->asset()->create([
            'name' => 'Piutang Dodi',
            'contact_id' => $contact->id,
        ]);

        // Fund cash first
        Transaction::factory()->create([
            'source_account_id' => $this->equity->id,
            'destination_account_id' => $this->cash->id,
            'amount' => 2000000.00,
            'transaction_date' => now(),
            'description' => 'Opening',
        ]);

        // Lend 1M
        Transaction::factory()->create([
            'source_account_id' => $this->cash->id,
            'destination_account_id' => $receivableAccount->id,
            'amount' => 1000000.00,
            'transaction_date' => now(),
            'description' => 'Lend to Dodi',
        ]);

        // Dodi repays 300K: Receivable → Cash
        Transaction::factory()->create([
            'source_account_id' => $receivableAccount->id,
            'destination_account_id' => $this->cash->id,
            'amount' => 300000.00,
            'transaction_date' => now(),
            'description' => 'Dodi partial payment',
        ]);

        // Outstanding receivable = 1000000 - 300000 = 700000
        expect($this->ledger->getAccountBalance($receivableAccount))->toBe('700000.00');
        // Cash = 2000000 - 1000000 + 300000 = 1300000
        expect($this->ledger->getAccountBalance($this->cash))->toBe('1300000.00');
    });
});

describe('transaction editing', function () {
    it('reflects edited amount in balance', function () {
        Transaction::factory()->create([
            'source_account_id' => $this->equity->id,
            'destination_account_id' => $this->bank->id,
            'amount' => 5000000.00,
            'transaction_date' => now(),
            'description' => 'Opening',
        ]);

        $expense = Transaction::factory()->create([
            'source_account_id' => $this->bank->id,
            'destination_account_id' => $this->food->id,
            'amount' => 100000.00,
            'transaction_date' => now(),
            'description' => 'Lunch',
        ]);

        expect($this->ledger->getAccountBalance($this->bank))->toBe('4900000.00');

        // Edit: change amount from 100K to 200K
        $expense->update(['amount' => 200000.00]);

        expect($this->ledger->getAccountBalance($this->bank))->toBe('4800000.00');
    });
});

describe('transaction deletion', function () {
    it('restores balance after deletion', function () {
        Transaction::factory()->create([
            'source_account_id' => $this->equity->id,
            'destination_account_id' => $this->bank->id,
            'amount' => 5000000.00,
            'transaction_date' => now(),
            'description' => 'Opening',
        ]);

        $expense = Transaction::factory()->create([
            'source_account_id' => $this->bank->id,
            'destination_account_id' => $this->food->id,
            'amount' => 100000.00,
            'transaction_date' => now(),
            'description' => 'Lunch',
        ]);

        expect($this->ledger->getAccountBalance($this->bank))->toBe('4900000.00');

        $expense->delete();

        expect($this->ledger->getAccountBalance($this->bank))->toBe('5000000.00');
    });
});

describe('budget month boundary', function () {
    it('only counts expenses within the month', function () {
        $augustStart = Carbon::create(2026, 8, 1, 0, 0, 0, 'UTC');
        $augustEnd = Carbon::create(2026, 8, 31, 23, 59, 59, 'UTC');
        $septemberStart = Carbon::create(2026, 9, 1, 0, 0, 0, 'UTC');

        // August expense
        Transaction::factory()->create([
            'source_account_id' => $this->bank->id,
            'destination_account_id' => $this->food->id,
            'amount' => 500000.00,
            'transaction_date' => Carbon::create(2026, 8, 15, 12, 0, 0, 'UTC'),
            'description' => 'August lunch',
        ]);

        // September expense
        Transaction::factory()->create([
            'source_account_id' => $this->bank->id,
            'destination_account_id' => $this->food->id,
            'amount' => 300000.00,
            'transaction_date' => Carbon::create(2026, 9, 2, 12, 0, 0, 'UTC'),
            'description' => 'September lunch',
        ]);

        $augustActual = $this->ledger->getExpenseActual($this->food, $augustStart, $augustEnd);
        $septemberActual = $this->ledger->getExpenseActual(
            $this->food,
            $septemberStart,
            Carbon::create(2026, 9, 30, 23, 59, 59, 'UTC')
        );

        expect($augustActual)->toBe('500000.00');
        expect($septemberActual)->toBe('300000.00');
    });
});

describe('timezone boundary', function () {
    it('correctly classifies a transaction at 23:55 local time', function () {
        // 23:55 WIB (UTC+7) on Aug 31 = 16:55 UTC on Aug 31 → still August
        $transactionDateUtc = Carbon::create(2026, 8, 31, 16, 55, 0, 'UTC');

        Transaction::factory()->create([
            'source_account_id' => $this->bank->id,
            'destination_account_id' => $this->food->id,
            'amount' => 50000.00,
            'transaction_date' => $transactionDateUtc,
            'description' => 'Late night snack',
        ]);

        // Query for August in UTC (what the backend would compute from WIB month boundaries)
        // Aug 1 00:00 WIB = Jul 31 17:00 UTC
        // Aug 31 23:59:59 WIB = Aug 31 16:59:59 UTC
        $augustStartUtc = Carbon::create(2026, 7, 31, 17, 0, 0, 'UTC');
        $augustEndUtc = Carbon::create(2026, 8, 31, 16, 59, 59, 'UTC');

        $septemberStartUtc = Carbon::create(2026, 8, 31, 17, 0, 0, 'UTC');
        $septemberEndUtc = Carbon::create(2026, 9, 30, 16, 59, 59, 'UTC');

        $augustActual = $this->ledger->getExpenseActual($this->food, $augustStartUtc, $augustEndUtc);
        $septemberActual = $this->ledger->getExpenseActual($this->food, $septemberStartUtc, $septemberEndUtc);

        expect($augustActual)->toBe('50000.00');
        expect($septemberActual)->toBe('0.00');
    });

    it('correctly classifies a transaction at 00:05 local time next day', function () {
        // 00:05 WIB (UTC+7) on Sep 1 = 17:05 UTC on Aug 31 → September in WIB
        $transactionDateUtc = Carbon::create(2026, 8, 31, 17, 5, 0, 'UTC');

        Transaction::factory()->create([
            'source_account_id' => $this->bank->id,
            'destination_account_id' => $this->food->id,
            'amount' => 30000.00,
            'transaction_date' => $transactionDateUtc,
            'description' => 'Midnight snack',
        ]);

        $augustStartUtc = Carbon::create(2026, 7, 31, 17, 0, 0, 'UTC');
        $augustEndUtc = Carbon::create(2026, 8, 31, 16, 59, 59, 'UTC');

        $septemberStartUtc = Carbon::create(2026, 8, 31, 17, 0, 0, 'UTC');
        $septemberEndUtc = Carbon::create(2026, 9, 30, 16, 59, 59, 'UTC');

        $augustActual = $this->ledger->getExpenseActual($this->food, $augustStartUtc, $augustEndUtc);
        $septemberActual = $this->ledger->getExpenseActual($this->food, $septemberStartUtc, $septemberEndUtc);

        expect($augustActual)->toBe('0.00');
        expect($septemberActual)->toBe('30000.00');
    });
});
