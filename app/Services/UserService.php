<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Contracts\UserServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class UserService implements UserServiceInterface
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
    ) {
    }

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->users->paginate($perPage);
    }

    public function create(array $attributes): User
    {
        return DB::transaction(fn () => $this->users->create($attributes));
    }

    public function update(User $user, array $attributes): User
    {
        return DB::transaction(fn () => $this->users->update($user, $attributes));
    }

    public function delete(User $user): void
    {
        DB::transaction(fn () => $this->users->delete($user));
    }
}

