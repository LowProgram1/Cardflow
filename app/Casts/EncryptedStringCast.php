<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Support\Facades\Crypt;

/**
 * Encrypted string cast that decrypts correctly even when the stored payload
 * was encrypted with Crypt::encrypt() (serialized). On get we decrypt and
 * unserialize if the result looks like a PHP serialized string.
 */
class EncryptedStringCast implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes)
    {
        if ($value === null || $value === '') {
            return $value;
        }

        try {
            $decrypted = Crypt::decrypt($value);
        } catch (\Throwable $e) {
            return $value;
        }

        if ($decrypted === null || $decrypted === '') {
            return $decrypted;
        }

        if (is_string($decrypted) && $this->looksSerialized($decrypted)) {
            try {
                $unserialized = @unserialize($decrypted);
                return $unserialized === false && $decrypted !== serialize(false) ? $decrypted : (string) $unserialized;
            } catch (\Throwable $e) {
                return $decrypted;
            }
        }

        return is_string($decrypted) ? $decrypted : (string) $decrypted;
    }

    public function set($model, string $key, $value, array $attributes)
    {
        if ($value === null || $value === '') {
            return [$key => $value];
        }

        return [$key => Crypt::encrypt((string) $value)];
    }

    private function looksSerialized(string $value): bool
    {
        return preg_match('/^s:\d+:"/', $value) === 1;
    }
}
