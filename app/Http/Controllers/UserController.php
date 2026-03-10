<?php

namespace App\Http\Controllers;

use App\Helpers\CurrencyHelper;
use App\Http\Requests\User\UserStoreRequest;
use App\Http\Requests\User\UserUpdateRequest;
use App\Models\User;
use App\Services\Contracts\UserServiceInterface;
use Illuminate\Http\RedirectResponse;
use Inertia\Response as InertiaResponse;

class UserController extends Controller
{
    public function __construct(
        private readonly UserServiceInterface $users,
    ) {
    }

    public function index(): InertiaResponse
    {
        $result = $this->users->paginate(10);

        return $this->inertia('Users/Index', [
            'users' => $result->items(),
            'pagination' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    public function store(UserStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $this->users->create($data);

        return redirect()->route('users.index')->with('flash', [
            'type' => 'success',
            'message' => 'User created successfully.',
        ]);
    }

    public function update(UserUpdateRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $this->users->update($user, $data);

        return redirect()->route('users.index')->with('flash', [
            'type' => 'success',
            'message' => 'User updated successfully.',
        ]);
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->users->delete($user);

        return redirect()->route('users.index')->with('flash', [
            'type' => 'delete',
            'message' => 'User removed.',
        ]);
    }
}

