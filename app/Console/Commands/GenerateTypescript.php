<?php

namespace App\Console\Commands;

use App\Enums\ErrorCode;
use BackedEnum;
use Illuminate\Console\Command;
use ReflectionEnum;

/** يولّد resources/js/types/generated.ts من الـEnums المسجلة — لا تُعدّل الملف يدويًا. */
class GenerateTypescript extends Command
{
    protected $signature = 'ts:generate {--check : فشل إذا كان الملف غير محدّث}';

    protected $description = 'توليد أنواع TypeScript من PHP Enums';

    /** @var list<class-string<BackedEnum>> سجّل هنا كل Enum يحتاجه الـFrontend */
    public static array $enums = [ErrorCode::class];

    public function handle(): int
    {
        $out = "// هذا الملف مُولَّد تلقائيًا بالأمر: php artisan ts:generate — لا تعدّله يدويًا.\n\n";
        foreach (static::$enums as $class) {
            $r = new ReflectionEnum($class);
            $name = $r->getShortName();
            /** @var list<BackedEnum&object> $cases */
            $cases = array_map(fn ($c) => $c->getValue(), $r->getCases());
            $out .= "export const {$name} = {\n";
            foreach ($cases as $c) {
                $out .= "    {$c->name}: '{$c->value}',\n";
            }
            $out .= "} as const;\nexport type {$name} = (typeof {$name})[keyof typeof {$name}];\n";
            if (method_exists($class, 'message')) {
                /** @var list<ErrorCode> $cases */
                $out .= "export const {$name}Message: Record<{$name}, string> = {\n";
                foreach ($cases as $c) {
                    $out .= "    {$c->value}: ".json_encode($c->message(), JSON_UNESCAPED_UNICODE).",\n";
                }
                $out .= "};\n";
            }
            $out .= "\n";
        }

        $path = resource_path('js/types/generated.ts');
        if ($this->option('check')) {
            if (! file_exists($path) || file_get_contents($path) !== $out) {
                $this->error('generated.ts غير محدّث — شغّل php artisan ts:generate');

                return self::FAILURE;
            }

            return self::SUCCESS;
        }
        file_put_contents($path, $out);
        $this->info('تم توليد '.$path);

        return self::SUCCESS;
    }
}
