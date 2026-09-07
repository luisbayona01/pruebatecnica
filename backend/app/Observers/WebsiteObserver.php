<?php

namespace App\Observers;

use App\Models\Activity;
use App\Models\Website;

class WebsiteObserver
{
    public function created(Website $website): void
    {
        Activity::record('created', 'website', $website->id, $website->name,
            "Se creó el sitio {$website->name}");
    }

    public function updated(Website $website): void
    {
        if ($website->wasChanged('is_favorite')) {
            Activity::record($website->is_favorite ? 'favorited' : 'unfavorited',
                'website', $website->id, $website->name,
                $website->is_favorite
                    ? "Se marcó {$website->name} como favorito"
                    : "Se desmarcó {$website->name} como favorito");

            return;
        }

        Activity::record('updated', 'website', $website->id, $website->name,
            "Se actualizó el sitio {$website->name}");
    }

    public function deleted(Website $website): void
    {
        // Registramos el nombre porque el id dejará de existir.
        Activity::record('deleted', 'website', $website->id, $website->name,
            "Se eliminó el sitio {$website->name}");
    }
}
