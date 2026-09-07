<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\Website;
use App\Observers\CategoryObserver;
use App\Observers\WebsiteObserver;
use App\Policies\CategoryPolicy;
use App\Policies\WebsitePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Website::observe(WebsiteObserver::class);
        Category::observe(CategoryObserver::class);

        Gate::policy(Website::class, WebsitePolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
    }
}
