import burger from "../assets/menu/burger.jpg";
import pizza from "../assets/menu/pizza.jpg";
import pasta from "../assets/menu/pasta.jpg";
import fries from "../assets/menu/fries.jpg";
import sandwich from "../assets/menu/sandwich.jpg";
import salad from "../assets/menu/salad.jpg";
import coffee from "../assets/menu/coffee.jpg";
import coke from "../assets/menu/coke.jpg";
import dessert from "../assets/menu/dessert.jpg";
import fallback from "../assets/menu/default.jpg";

const foodImages = {
  burger,
  pizza,
  pasta,
  fries,
  sandwich,
  salad,
  coffee,
  coke,
  dessert,
  default: fallback,
};

export function getFoodImage(name = "") {
  const lower = name.toLowerCase();

  if (lower.includes("burger")) return foodImages.burger;
  if (lower.includes("pizza")) return foodImages.pizza;
  if (lower.includes("pasta")) return foodImages.pasta;
  if (lower.includes("fries")) return foodImages.fries;
  if (lower.includes("sandwich")) return foodImages.sandwich;
  if (lower.includes("salad")) return foodImages.salad;
  if (lower.includes("coffee")) return foodImages.coffee;
  if (lower.includes("coke") || lower.includes("cola")) return foodImages.coke;
  if (lower.includes("cake") || lower.includes("ice")) return foodImages.dessert;

  return foodImages.default;
}