<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'phone_number',
        'message',
        'gateway',
        'status',
        'error_details',
        'notification_id',
    ];

    /**
     * Get the notification associated with the SMS log.
     */
    public function notification(): BelongsTo
    {
        return $this->belongsTo(Notification::class);
    }
}
