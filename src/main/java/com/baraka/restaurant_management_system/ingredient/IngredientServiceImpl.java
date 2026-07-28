package com.baraka.restaurant_management_system.ingredient;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IngredientServiceImpl implements IngredientService {

    private final IngredientRepository ingredientRepository;

    public IngredientServiceImpl(IngredientRepository ingredientRepository) {
        this.ingredientRepository = ingredientRepository;
    }

    @Override
    public Ingredient createIngredient(Ingredient ingredient) {

        if (ingredientRepository.existsByNameIgnoreCase(ingredient.getName())) {
            throw new RuntimeException("Ingredient already exists.");
        }


        return ingredientRepository.save(ingredient);
    }

    @Override
    public List<Ingredient> getAllIngredients() {
        return ingredientRepository.findAll();
    }

    @Override
    public Ingredient getIngredientById(Integer id) {
        return ingredientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingredient not found."));
    }

    @Override
    public Ingredient updateIngredient(Integer id, Ingredient updatedIngredient) {

        Ingredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingredient not found."));

        ingredient.setName(updatedIngredient.getName());
        ingredient.setQuantity(updatedIngredient.getQuantity());
        ingredient.setUnit(updatedIngredient.getUnit());

        return ingredientRepository.save(ingredient);
    }

    @Override
    public void deleteIngredient(Integer id) {

        if (!ingredientRepository.existsById(id)) {
            throw new RuntimeException("Ingredient not found.");
        }

        ingredientRepository.deleteById(id);
    }

    @Override
    public List<Ingredient> getLowStockIngredients() {

        return ingredientRepository.findAll()
                .stream()
                .filter(i -> i.getQuantity() <= 5)
                .toList();
    }
}