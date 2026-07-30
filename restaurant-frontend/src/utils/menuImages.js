import burger from "@/assets/menu/burger.jpg";
import chickenSoup from "@/assets/menu/chicken-soup.jpg";
import chocolateCake from "@/assets/menu/chocolate-cake.jpg";
import coffee from "@/assets/menu/coffee.jpg";
import coke from "@/assets/menu/coke.jpg";
import dessert from "@/assets/menu/dessert.jpg";
import fishDish from "@/assets/menu/fish-dish.jpg";
import fries from "@/assets/menu/fries.jpg";
import mangoJuice from "@/assets/menu/mango-juice.jpg";
import paneerButterMasala from "@/assets/menu/paneer-butter-masala.jpg";
import pasta from "@/assets/menu/pasta.jpg";
import pizza from "@/assets/menu/pizza.jpg";
import salad from "@/assets/menu/salad.jpg";
import sandwich from "@/assets/menu/sandwich.jpg";
import vadaPav from "@/assets/menu/vada-pav.jpg";
import fallback from "@/assets/menu/default.jpg";

const foodImages = {
  burger,
  chickenSoup,
  chocolateCake,
  coffee,
  coke,
  dessert,
  fishDish,
  fries,
  mangoJuice,
  paneerButterMasala,
  pasta,
  pizza,
  salad,
  sandwich,
  vadaPav,
  default: fallback,
};

// Ordered most-specific to least-specific so e.g. "vada pav" matches
// before any looser keyword accidentally grabs it first.
const rules = [
  { keywords: ["vada pav", "vada-pav", "vadapav"], image: foodImages.vadaPav },
  { keywords: ["paneer butter masala", "paneer"], image: foodImages.paneerButterMasala },
  { keywords: ["chocolate cake", "cake"], image: foodImages.chocolateCake },
  { keywords: ["chicken soup"], image: foodImages.chickenSoup },
  { keywords: ["fish"], image: foodImages.fishDish },
  { keywords: ["mango juice", "mango"], image: foodImages.mangoJuice },
  { keywords: ["coke", "cola", "coca cola"], image: foodImages.coke },
  { keywords: ["coffee"], image: foodImages.coffee },
  { keywords: ["burger"], image: foodImages.burger },
  { keywords: ["pizza"], image: foodImages.pizza },
  { keywords: ["pasta"], image: foodImages.pasta },
  { keywords: ["fries"], image: foodImages.fries },
  { keywords: ["sandwich"], image: foodImages.sandwich },
  { keywords: ["salad"], image: foodImages.salad },
  { keywords: ["dessert", "ice cream", "ice"], image: foodImages.dessert },
];

export function getFoodImage(name = "") {
  const lower = name.toLowerCase();

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      return rule.image;
    }
  }

  return foodImages.default;
}