<?php

use App\Actions\Orders\CreateOrder;
use App\Models\Product;
use App\Models\User;

// ينشئ أوردرًا جديدًا في مرحلة التصميم (بنود بلا خيارات مطلوبة) في قاعدة pbms_e2e ويطبع رقمه.
$u = User::where('email', 'superadmin@pbms.test')->first();
$prods = Product::where('is_active', 1)->get()->filter(fn ($p) => ! $p->optionGroups()->where('is_required', 1)->exists())->values();
$o = app(CreateOrder::class)->handle($u, ['customer_id' => 104, 'items' => [['product_id' => $prods[0]->id, 'quantity' => max(1, (int) $prods[0]->minimum_quantity)], ['product_id' => $prods[1 % $prods->count()]->id, 'quantity' => max(1, (int) $prods[1 % $prods->count()]->minimum_quantity)]]]);
echo 'ORDER_ID='.$o->id;
