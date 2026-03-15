<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Feature extends Model
{
    /** Default feature names for new users (cards and expenses). */
    public const DEFAULT_FEATURE_NAMES = ['cards', 'expense_tracker'];

    protected $fillable = [
        'name',
        'display_name',
    ];

    /**
     * IDs of features to assign to new users by default (cards, expense_tracker).
     *
     * @return array<int>
     */
    public static function defaultFeatureIds(): array
    {
        return static::query()
            ->whereIn('name', self::DEFAULT_FEATURE_NAMES)
            ->pluck('id')
            ->all();
    }

    /**
     * Users that have this feature enabled.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'feature_user')
            ->withTimestamps();
    }
}
