<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'user_id',
    'title',
    'message',
    'type',
    'transaction_key',
    'is_admin',
    'read_at',
])]
class Notification extends Model
{
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'is_admin' => 'boolean',
            'read_at' => 'datetime',
        ];
    }
}
