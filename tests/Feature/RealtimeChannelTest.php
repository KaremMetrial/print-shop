<?php

use App\Models\User;

it('lets a user authorize only their own private channel', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $this->actingAs($user)->post('/broadcasting/auth', ['channel_name' => "private-App.Models.User.{$user->id}", 'socket_id' => '123.456'])
        ->assertOk()->assertJsonStructure(['auth']);

    $this->actingAs($user)->post('/broadcasting/auth', ['channel_name' => "private-App.Models.User.{$other->id}", 'socket_id' => '123.456'])
        ->assertForbidden();
});

it('rejects channel authorization for guests', function () {
    $this->post('/broadcasting/auth', ['channel_name' => 'private-App.Models.User.1', 'socket_id' => '1.2'])->assertForbidden();
});
