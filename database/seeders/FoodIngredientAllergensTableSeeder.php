<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FoodIngredientAllergensTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('food_ingredient_allergens')->delete();

    }
}
