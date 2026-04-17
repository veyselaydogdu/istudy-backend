<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class MealIngredientPivotTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('meal_ingredient_pivot')->delete();

    }
}
