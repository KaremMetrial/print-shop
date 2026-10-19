<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $payment_id
 * @property int $order_id
 * @property int $amount
 */
class PaymentAllocation extends Model
{
    protected $guarded = [];
}
