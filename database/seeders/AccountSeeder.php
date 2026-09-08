<?php

namespace Database\Seeders;

use App\Enums\CategoryType;
use App\Models\Account;
use App\Models\AccountType;
use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $walletType = AccountType::firstOrCreate(['name' => 'Dompet']);
        foreach ([['name' => 'Tunai', 'icon' => 'IconCash'], ['name' => 'Bank BCA', 'icon' => 'IconBuildingBank'], ['name' => 'E-Wallet', 'icon' => 'IconWallet']] as $account) {
            Account::firstOrCreate(['name' => $account['name']], [...$account, 'account_type_id' => $walletType->id]);
        }
        foreach ([
            ['name' => 'Gaji', 'type' => CategoryType::Income, 'icon' => 'IconBriefcase'],
            ['name' => 'Bonus', 'type' => CategoryType::Income, 'icon' => 'IconGift'],
            ['name' => 'Makanan & Minuman', 'type' => CategoryType::Expense, 'icon' => 'IconToolsKitchen2'],
            ['name' => 'Transportasi', 'type' => CategoryType::Expense, 'icon' => 'IconCar'],
            ['name' => 'Utilitas', 'type' => CategoryType::Expense, 'icon' => 'IconBolt'],
            ['name' => 'Hiburan', 'type' => CategoryType::Expense, 'icon' => 'IconDeviceGamepad2'],
            ['name' => 'Kesehatan', 'type' => CategoryType::Expense, 'icon' => 'IconHeartbeat'],
            ['name' => 'Utang', 'type' => CategoryType::Debt, 'icon' => null],
            ['name' => 'Piutang', 'type' => CategoryType::Receivable, 'icon' => null],
            ['name' => 'Transfer', 'type' => CategoryType::Transfer, 'icon' => null],
            ['name' => 'Saldo Awal', 'type' => CategoryType::OpeningBalance, 'icon' => null],
        ] as $category) {
            Category::firstOrCreate(['name' => $category['name'], 'type' => $category['type']], $category);
        }
    }
}
