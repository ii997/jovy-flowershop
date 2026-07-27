<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\User;
use Illuminate\Console\Command;

class PurgeDeletedAccountsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:purge-deleted-accounts';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently purge accounts that have been requested for deletion over 30 days ago.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $expiredUsers = User::whereNotNull('deletion_requested_at')
            ->where('deletion_requested_at', '<=', now()->subDays(30))
            ->get();

        if ($expiredUsers->isEmpty()) {
            $this->info('No accounts to purge.');
            return Command::SUCCESS;
        }

        $count = 0;
        foreach ($expiredUsers as $user) {
            // Nullify user_id on orders to keep order history intact
            Order::where('user_id', $user->id)->update(['user_id' => null]);

            // Permanently delete user
            $user->delete();
            $count++;
        }

        $this->info("Successfully purged {$count} expired user account(s).");

        return Command::SUCCESS;
    }
}
