<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentTerm extends Model
{
    protected $fillable = ['months'];

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'payment_term_id');
    }
}
