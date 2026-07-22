<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'title',
    'message',
    'type',
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
