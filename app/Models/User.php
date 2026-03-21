<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Log;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Features enabled for this user (F-ACS).
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(Feature::class, 'feature_user')
            ->withTimestamps();
    }

    /**
     * Check if the user has a feature by name (uses loaded relation).
     */
    public function hasFeature(string $featureName): bool
    {
        if (! $this->relationLoaded('features')) {
            $this->load('features');
        }

        return $this->features->contains('name', $featureName);
    }

    public function sendPasswordResetNotification($token): void
    {
        // Same pattern as registration mail: after response, sync notify (no queue worker needed).
        $user = $this;
        dispatch(function () use ($user, $token) {
            try {
                $user->notify(new ResetPassword($token));
            } catch (\Throwable $e) {
                Log::warning('Password reset email failed to send.', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ]);
            }
        })->afterResponse();
    }
}
