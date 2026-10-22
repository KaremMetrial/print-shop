<?php

use App\Models\User;

it('saves an employee edit sent exactly like the browser form (empty password, empty specialties)', function () {
    $actor = User::factory()->superAdmin()->create();
    $employee = User::factory()->dataEntry()->create();

    $this->actingAs($actor)->patch("/employees/{$employee->id}", [
        'name' => 'اسم من المتصفح', 'email' => $employee->email, 'phone' => '01055556666',
        'role' => 'DATA_ENTRY', 'password' => '', 'specialty_ids' => [], 'availability' => 'AVAILABLE',
    ])->assertSessionHasNoErrors()->assertRedirect(route('employees.index'));

    expect($employee->fresh()->name)->toBe('اسم من المتصفح');
});
