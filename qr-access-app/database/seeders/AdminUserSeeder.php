<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@qraccess.local'],
            [
                'name' => 'Administrateur QR Access',
                'password' => Hash::make('QrAccess2026!'),
                'email_verified_at' => now(),
            ]
        );
    }
}
