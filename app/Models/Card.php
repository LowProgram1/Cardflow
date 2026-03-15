<?php

namespace App\Models;

use App\Casts\EncryptedStringCast;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Card extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bank_name',
        'card_type_id',
        'name',
        'last_four',
        'limit',
        'statement_day',
        'due_day',
        'is_active',
        'color',
    ];

    protected $casts = [
        'limit' => 'decimal:2',
        'is_active' => 'boolean',
        'last_four' => EncryptedStringCast::class,
        'bank_name' => EncryptedStringCast::class,
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cardType()
    {
        return $this->belongsTo(CardType::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
}

