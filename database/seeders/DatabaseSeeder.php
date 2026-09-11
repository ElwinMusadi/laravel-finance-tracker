<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => env('ADMIN_NAME', 'Admin'),
            'username' => env('ADMIN_USERNAME', 'admin'),
            'password' => env('ADMIN_PASSWORD', 'password'),
        ]);

        $this->call([
            AccountSeeder::class,
        ]);
    }
}
