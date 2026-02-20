<?php

namespace App\Models\Health;

use App\Models\Base\BaseModel;

class FoodIngredient extends BaseModel
{
    protected $table = 'food_ingredients';

    protected $fillable = [
        'tenant_id',
        'name',
        'allergen_info',
        'created_by',
        'updated_by',
    ];

    // Allergen relation
    public function allergens()
    {
        return $this->belongsToMany(Allergen::class, 'food_ingredient_allergens', 'ingredient_id', 'allergen_id');
    }

    // Reverse relation
    public function meals()
    {
        return $this->belongsToMany(Meal::class, 'meal_ingredient_pivot', 'ingredient_id', 'meal_id');
    }
}
