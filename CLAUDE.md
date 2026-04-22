Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to enhance the user's satisfaction building Laravel applications.

## Foundational Context
This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.4.10
- laravel/framework (LARAVEL) - v12
- laravel/prompts (PROMPTS) - v0
- laravel/pint (PINT) - v1


## Conventions
- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts
- Do not create verification scripts or tinker when tests cover that functionality and prove it works. Unit and feature tests are more important.

## Application Structure & Architecture
- Stick to existing directory structure - don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling
- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Replies
- Be concise in your explanations - focus on what's important rather than explaining obvious details.

## Documentation Files
- You must only create documentation files if explicitly requested by the user.


=== boost rules ===

## Laravel Boost
- Laravel Boost is an MCP server that comes with powerful tools designed specifically for this application. Use them.

## Artisan
- Use the `list-artisan-commands` tool when you need to call an Artisan command to double check the available parameters.

## URLs
- Whenever you share a project URL with the user you should use the `get-absolute-url` tool to ensure you're using the correct scheme, domain / IP, and port.

## Tinker / Debugging
- You should use the `tinker` tool when you need to execute PHP to debug code or query Eloquent models directly.
- Use the `database-query` tool when you only need to read from the database.

## Reading Browser Logs With the `browser-logs` Tool
- You can read browser logs, errors, and exceptions using the `browser-logs` tool from Boost.
- Only recent browser logs will be useful - ignore old logs.

## Searching Documentation (Critically Important)
- Boost comes with a powerful `search-docs` tool you should use before any other approaches. This tool automatically passes a list of installed packages and their versions to the remote Boost API, so it returns only version-specific documentation specific for the user's circumstance. You should pass an array of packages to filter on if you know you need docs for particular packages.
- The 'search-docs' tool is perfect for all Laravel related packages, including Laravel, Inertia, Livewire, Filament, Tailwind, Pest, Nova, Nightwatch, etc.
- You must use this tool to search for Laravel-ecosystem documentation before falling back to other approaches.
- Search the documentation before making code changes to ensure we are taking the correct approach.
- Use multiple, broad, simple, topic based queries to start. For example: `['rate limiting', 'routing rate limiting', 'routing']`.
- Do not add package names to queries - package information is already shared. For example, use `test resource table`, not `filament 4 test resource table`.

### Available Search Syntax
- You can and should pass multiple queries at once. The most relevant results will be returned first.

1. Simple Word Searches with auto-stemming - query=authentication - finds 'authenticate' and 'auth'
2. Multiple Words (AND Logic) - query=rate limit - finds knowledge containing both "rate" AND "limit"
3. Quoted Phrases (Exact Position) - query="infinite scroll" - Words must be adjacent and in that order
4. Mixed Queries - query=middleware "rate limit" - "middleware" AND exact phrase "rate limit"
5. Multiple Queries - queries=["authentication", "middleware"] - ANY of these terms


=== php rules ===

## PHP

- Always use curly braces for control structures, even if it has one line.

### Constructors
- Use PHP 8 constructor property promotion in `__construct()`.
    - <code-snippet>public function __construct(public GitHub $github) { }</code-snippet>
- Do not allow empty `__construct()` methods with zero parameters.

### Type Declarations
- Always use explicit return type declarations for methods and functions.
- Use appropriate PHP type hints for method parameters.

<code-snippet name="Explicit Return Types and Method Params" lang="php">
protected function isAccessible(User $user, ?string $path = null): bool
{
    ...
}
</code-snippet>

## Comments
- Prefer PHPDoc blocks over comments. Never use comments within the code itself unless there is something _very_ complex going on.

## PHPDoc Blocks
- Add useful array shape type definitions for arrays when appropriate.

## Enums
- Typically, keys in an Enum should be TitleCase. For example: `FavoritePerson`, `BestLake`, `Monthly`.


=== laravel/core rules ===

## Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using the `list-artisan-commands` tool.
- If you're creating a generic PHP class, use `artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Database
- Always use proper Eloquent relationship methods with return type hints. Prefer relationship methods over raw queries or manual joins.
- Use Eloquent models and relationships before suggesting raw database queries
- Avoid `DB::`; prefer `Model::query()`. Generate code that leverages Laravel's ORM capabilities rather than bypassing them.
- Generate code that prevents N+1 query problems by using eager loading.
- Use Laravel's query builder for very complex database operations.

### Model Creation
- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `list-artisan-commands` to check the available options to `php artisan make:model`.

### APIs & Eloquent Resources
- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

### Controllers & Validation
- Always create Form Request classes for validation rather than inline validation in controllers. Include both validation rules and custom error messages.
- Check sibling Form Requests to see if the application uses array or string based validation rules.

### Queues
- Use queued jobs for time-consuming operations with the `ShouldQueue` interface.

### Authentication & Authorization
- Use Laravel's built-in authentication and authorization features (gates, policies, Sanctum, etc.).

### URL Generation
- When generating links to other pages, prefer named routes and the `route()` function.

### Configuration
- Use environment variables only in configuration files - never use the `env()` function directly outside of config files. Always use `config('app.name')`, not `env('APP_NAME')`.

### Testing
- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] <name>` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

### Vite Error
- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.


=== laravel/v12 rules ===

## Laravel 12

- Use the `search-docs` tool to get version specific documentation.
- Since Laravel 11, Laravel has a new streamlined file structure which this project uses.

### Laravel 12 Structure
- No middleware files in `app/Http/Middleware/`.
- `bootstrap/app.php` is the file to register middleware, exceptions, and routing files.
- `bootstrap/providers.php` contains application specific service providers.
- **No app\Console\Kernel.php** - use `bootstrap/app.php` or `routes/console.php` for console configuration.
- **Commands auto-register** - files in `app/Console/Commands/` are automatically available and do not require manual registration.

### Database
- When modifying a column, the migration must include all of the attributes that were previously defined on the column. Otherwise, they will be dropped and lost.
- Laravel 11 allows limiting eagerly loaded records natively, without external packages: `$query->latest()->limit(10);`.

### Models
- Casts can and likely should be set in a `casts()` method on a model rather than the `$casts` property. Follow existing conventions from other models.


=== pint/core rules ===

## Laravel Pint Code Formatter

- You must run `vendor/bin/pint --dirty` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test`, simply run `vendor/bin/pint` to fix any formatting issues.
</laravel-boost-guidelines>

---

# iStudy — Proje Genel Bakış

> Multi-tenant SaaS anaokulu/kreş yönetim sistemi — PHP 8.4 / Laravel 12 / React Native / Next.js

## Katman Haritası

| Katman | Teknoloji | Port | Token |
|--------|-----------|------|-------|
| **Backend** | Laravel 12 / PHP 8.4, MySQL 8, Sanctum, Docker | 8000 / 443 | Bearer (Sanctum) |
| **Frontend Admin** | Next.js 16, TypeScript 5, Tailwind v3, Vristo | 3001 | `admin_token` (localStorage) |
| **Frontend Tenant** | Next.js 16, TypeScript 5, Tailwind v3, Vristo | 3002 | `tenant_token` (localStorage) |
| **Mobil (Veli)** | React Native 0.83.2 + Expo ~55, Expo Router v3 | Android: `10.0.2.2:8000` / iOS: `localhost:8000` | `parent_token` (AsyncStorage) |

**Proje yolları:**
- Backend: `istudy-backend/`
- Frontend Tenant: `istudy-backend/frontend-tenant-and-website/`
- Frontend Admin: `istudy-backend/frontend-admin/`
- Mobil: `istudy-backend/parent-mobile-app/`

---

## Hafıza Dosyaları — Detaylı Bilgi İçin

> **Ajan talimatı:** Göreve başlamadan önce ilgili hafıza dosyasını oku. CLAUDE.md sadece özet ve yönlendirme içerir.

| Dosya | Kapsam |
|-------|--------|
| `PROJECT_MEMORY.md` | Laravel backend: mimari, route'lar, controller şablonları, DB şeması, modüller, kritik kurallar |
| `PROJECT_MEMORY_FRONTEND.md` | Frontend Tenant (port 3002): dizin yapısı, TS tipleri, UI standartları, sayfa detayları |
| `PROJECT_MEMORY_FRONTEND_ADMIN.md` | Frontend Admin (port 3001): admin paneli, API eşleşmeleri, dashboard stats |
| `PROJECT_MEMORY_MOBILE.md` | React Native veli + öğretmen uygulaması: Expo Router, ekranlar, tüm API endpoint'leri, auth akışı |

---

## Multi-Tenant Mimari (Özet)

```
SUPER ADMIN → tüm tenant'lar
Tenant (kurum) → 1..N Schools → Classes → Children / Teachers / Families
```

**Rol hiyerarşisi:** `super_admin` > `tenant_owner` > `school_admin` > `teacher` > `parent`

- `BaseModel` → `WHERE {table}.tenant_id = auth()->user()->tenant_id` global scope otomatik
- `User` modeli `Authenticatable`'dan türer → scope yok
- **Veli kullanıcılar `tenant_id = NULL`** → Aile/sağlık verileri yüklenirken `withoutGlobalScope('tenant')` ZORUNLU

---

## Kritik Backend Kuralları

### Nested Route Positional Arg
```php
// YANLIŞ:
public function show(Child $child): JsonResponse
// DOĞRU (schools/{school_id}/children/{child}):
public function show(int $school_id, Child $child): JsonResponse
```

### paginatedResponse
```php
// DOĞRU:
return $this->paginatedResponse(ChildResource::collection($paginator));
// YANLIŞ — ->resource raw paginator döndürür:
return $this->paginatedResponse(ChildResource::collection($paginator)->resource);
// Custom alan eklemek için:
$result = $data->getCollection()->map(fn($item) => [...]);
$data->setCollection($result);
```

### Laravel 12 Filesystem
```php
Storage::disk('local')   // DOĞRU — storage/app/private/, web'den erişilemez
Storage::disk('private') // HATA — Laravel 12'de bu disk yok
// Private dosya için signed route zorunlu
```

### validate() Pozisyonu
`$request->validate()` / FormRequest → try-catch DIŞINDA (422 garantisi için)

### BelongsToMany Pivot Accessor
Constraint callback'li eager load'da `->pivot` çalışmaz → `DB::table()` kullan

### MySQL FK 64-Karakter Limiti
Uzun tablo adlarında explicit kısa FK ismi zorunlu:
```php
$table->foreign('activity_class_id', 'acsc_activity_class_fk')->...
```

---

## Docker Komutları

```bash
cd dockerfiles && docker compose up -d
docker compose -f dockerfiles/docker-compose.yml exec app php artisan migrate
docker compose -f dockerfiles/docker-compose.yml restart app   # PHP değişikliği sonrası ZORUNLU
docker compose -f dockerfiles/docker-compose.yml exec app php artisan route:clear  # Yeni route 404 ise
vendor/bin/pint --dirty   # Her PHP değişikliği sonrası
```

---

## Frontend Kritik Kurallar

- **Token:** Tenant frontend'de her zaman `tenant_token`, admin'de `admin_token`
- **Tailwind:** v3 kullan — `@import "tailwindcss"` (v4) YAZMA
- **`app/page.tsx`** OLUŞTURMA — `(website)/page.tsx` zaten `/` alır
- **`(auth)/layout.tsx`**: SADECE `<>{children}</>` — wrapper div ekleme
- **Tab Fetch Flag:** `const [xxxFetched, setXxxFetched] = useState(false)` — `data.length === 0` kontrolü YANLIŞ
- **Zod v4:** `import * as z from 'zod'`
- **ApexCharts:** `dynamic(..., { ssr: false })` zorunlu

---

## Mobil Kritik Kurallar

- **Expo Router Stack Layout:** Alt ekranların ayrı tab olmaması için `_layout.tsx` ile Stack navigator ekle
- **iOS Nested Modal:** Modal içinde Modal açılamaz → inline dropdown pattern kullan
- **Signed URL:** Mobil `<Image>` auth header gönderemez → `middleware: ['auth:sanctum', 'signed']` kullan (her ikisi birden)
- **API prefix:** Tüm veli endpoint'leri `/parent/` prefix'li (ör: `/parent/activity-classes`)

---

## Yeni Modül Ekleme Checklist

1. Migration + Model (`BaseModel`'den türet) + Factory + Seeder
2. FormRequest (`Store`, `Update`) + API Resource + Service + Policy
3. Controller (uygun base'den türet) + Route (`routes/api.php`)
4. Tests (Feature) + `vendor/bin/pint --dirty`
5. `php artisan route:clear` + `docker compose restart app`
