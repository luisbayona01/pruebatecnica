<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'type',
        'subject_type',
        'subject_id',
        'subject_name',
        'description',
    ];

    public static function record(string $type, string $subjectType, ?int $subjectId, string $subjectName, string $description): self
    {
        return static::create([
            'type' => $type,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'subject_name' => $subjectName,
            'description' => $description,
        ]);
    }
}
