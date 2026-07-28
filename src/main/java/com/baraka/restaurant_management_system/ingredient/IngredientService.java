package com.baraka.restaurant_management_system.ingredient;

import java.util.List;

public interface IngredientService {

    Ingredient createIngredient(Ingredient ingredient);

    List<Ingredient> getAllIngredients();

    Ingredient getIngredientById(Integer id);

    Ingredient updateIngredient(Integer id, Ingredient ingredient);

    void deleteIngredient(Integer id);

    List<Ingredient> getLowStockIngredients();
}