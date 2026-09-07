<?php

namespace App\Observers;

use App\Models\Activity;
use App\Models\Category;

class CategoryObserver
{
    public function created(Category $category): void
    {
        Activity::record('created', 'category', $category->id, $category->name,
            "Se creó la categoría {$category->name}");
    }

    public function deleted(Category $category): void
    {
        Activity::record('deleted', 'category', $category->id, $category->name,
            "Se eliminó la categoría {$category->name}");
    }
}
