<?php

namespace Database\Seeders;

use App\Models\Account;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database with the default chart of accounts.
     */
    public function run(): void
    {
        $accounts = [
            // Equity (system account for opening balances)
            ['name' => 'Opening Balance', 'type' => 'equity', 'icon' => 'IconScale'],

            // Asset accounts (user's money containers)
            ['name' => 'Cash', 'type' => 'asset', 'icon' => 'IconCash'],
            ['name' => 'Bank BCA', 'type' => 'asset', 'icon' => 'IconBuildingBank'],
            ['name' => 'E-Wallet', 'type' => 'asset', 'icon' => 'IconWallet'],

            // Revenue accounts (income categories)
            ['name' => 'Salary', 'type' => 'revenue', 'icon' => 'IconBriefcase'],
            ['name' => 'Bonus', 'type' => 'revenue', 'icon' => 'IconGift'],
            ['name' => 'Interest', 'type' => 'revenue', 'icon' => 'IconPercentage'],

            // Expense accounts (spending categories)
            ['name' => 'Food & Drinks', 'type' => 'expense', 'icon' => 'IconToolsKitchen2'],
            ['name' => 'Transport', 'type' => 'expense', 'icon' => 'IconCar'],
            ['name' => 'Utilities', 'type' => 'expense', 'icon' => 'IconBolt'],
            ['name' => 'Entertainment', 'type' => 'expense', 'icon' => 'IconDeviceGamepad2'],
            ['name' => 'Health', 'type' => 'expense', 'icon' => 'IconHeartbeat'],
        ];

        foreach ($accounts as $account) {
            Account::create($account);
        }
    }
}
