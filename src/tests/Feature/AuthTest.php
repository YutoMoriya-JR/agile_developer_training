<?php

namespace Tests\Feature;

use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_registration_creates_user_in_existing_team_and_logs_in(): void
    {
        $team = Team::create(['name' => 'Development']);
        $this->get('/register')->assertOk();
        $this->post('/register', [
            'name' => 'Member', 'team' => $team->name, 'email' => 'member@example.test',
            'password' => 'example-password', 'password_confirmation' => 'example-password',
        ])->assertSessionHasNoErrors()->assertRedirect('/reports');
        $user = User::sole();
        $this->assertAuthenticatedAs($user);
        $this->assertSame($team->id, $user->team_id);
        $this->assertTrue(Hash::check('example-password', $user->password));
        $this->assertDatabaseCount('teams', 1);
    }

    public function test_registration_can_create_a_team_and_rejects_invalid_input(): void
    {
        $this->post('/register', [
            'name' => 'Member', 'team' => 'New team', 'email' => 'member@example.test',
            'password' => 'short', 'password_confirmation' => 'different',
        ])->assertSessionHasErrors('password');
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('teams', 0);

        $this->post('/register', [
            'name' => 'Member', 'team' => 'New team', 'email' => 'member@example.test',
            'password' => 'example-password', 'password_confirmation' => 'example-password',
        ])->assertSessionHasNoErrors()->assertRedirect('/reports');
        $this->assertDatabaseHas('teams', ['name' => 'New team']);
    }

    public function test_login_and_logout(): void
    {
        $user = User::factory()->create(['password' => 'example-password']);
        $this->get('/login')->assertOk();
        $this->post('/login', ['email' => $user->email, 'password' => 'wrong'])
            ->assertSessionHasErrors('email');
        $this->assertGuest();
        $this->post('/login', ['email' => $user->email, 'password' => 'example-password'])
            ->assertSessionHasNoErrors()->assertRedirect('/reports');
        $this->assertAuthenticatedAs($user);
        $this->post('/logout')->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_login_attempts_are_rate_limited(): void
    {
        foreach (range(1, 5) as $attempt) {
            $this->post('/login', ['email' => 'missing@example.test', 'password' => 'wrong'])->assertRedirect();
        }
        $this->post('/login', ['email' => 'missing@example.test', 'password' => 'wrong'])->assertStatus(429);
    }
}