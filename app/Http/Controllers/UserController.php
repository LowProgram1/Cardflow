<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\UserStoreRequest;
use App\Http\Requests\User\UserUpdateRequest;
use App\Models\Feature;
use App\Models\User;
use App\Services\Contracts\UserServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
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
        $result->getCollection()->load('features');
        $users = $result->getCollection()->map(fn (User $u) => array_merge($u->toArray(), [
            'feature_ids' => $u->features->pluck('id')->all(),
        ]))->values()->all();

        return $this->inertia('Users/Index', [
            'users' => $users,
            'features' => Feature::orderBy('display_name')->get(['id', 'name', 'display_name']),
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
        $featureIds = $data['feature_ids'] ?? [];
        unset($data['feature_ids']);
        if ($featureIds === []) {
            $featureIds = Feature::defaultFeatureIds();
        }
        // Account owner sets password via Forgot Password or secure setup link; use a random placeholder until then.
        $data['password'] = Hash::make(Str::random(64));
        $user = $this->users->create($data);
        $user->features()->sync($featureIds);

        return redirect()->route('users.index')->with('flash', [
            'type' => 'success',
            'message' => 'User created. They can set their password via Forgot Password or the registration verification link.',
        ]);
    }

    public function update(UserUpdateRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();
        $featureIds = $data['feature_ids'] ?? [];
        unset($data['feature_ids']);
        // Only the account owner can change their password (via Profile or Forgot Password).
        unset($data['password']);
        $this->users->update($user, $data);
        $user->features()->sync($featureIds);

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

