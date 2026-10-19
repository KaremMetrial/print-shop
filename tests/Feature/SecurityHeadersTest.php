<?php

it('sends hardening headers on web responses', function () {
    $r = $this->get('/login');
    $r->assertHeader('X-Frame-Options', 'DENY')->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('Referrer-Policy', 'same-origin');
});
