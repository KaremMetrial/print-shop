<?php

namespace App\Actions\Catalog;

use App\Models\Product;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Support\Money;
use Illuminate\Support\Facades\DB;

class SaveProduct
{
    public function __construct(private AuditService $audit) {}

    /** @param array<string, mixed> $data */
    public function handle(User $actor, array $data, ?Product $product = null): Product
    {
        return DB::transaction(function () use ($actor, $data, $product) {
            $attrs = array_intersect_key($data, array_flip(['category_id', 'name', 'description', 'base_unit_price', 'minimum_quantity', 'required_specialty_id', 'is_active']));
            $attrs['updated_by'] = $actor->id;

            if (! $product) {
                $product = Product::create($attrs + ['is_active' => true]);
                $this->audit->record('product.created', $product, [], ['name' => $product->name]);

                return $product;
            }
            $keys = array_keys($attrs);
            $before = $this->snap($product, $keys);
            $product->update($attrs);
            [$old, $new] = $this->audit->diff($before, $this->snap($product->refresh(), $keys));
            unset($old['updated_by'], $new['updated_by']);
            if ($new) {
                $action = array_key_exists('base_unit_price', $new) ? 'product.price_changed' : (array_key_exists('is_active', $new) ? 'product.status_changed' : 'product.updated');
                $this->audit->record($action, $product, $old, $new);
            }

            return $product;
        });
    }

    /**
     * @param  list<string>  $keys
     * @return array<string, mixed>
     */
    private function snap(Product $p, array $keys): array
    {
        $o = [];
        foreach ($keys as $k) {
            $v = $p->getAttribute($k);
            $o[$k] = $v instanceof Money ? $v->minor : $v;
        }

        return $o;
    }
}
