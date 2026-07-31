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
import chickenBiryani from "@/assets/menu/chicken-soup.jpg";
import fallback from "@/assets/menu/default.jpg";


const foodImages = {
  burger,
  chickenSoup,
  chickenBiryani,
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
// before any looser keyword accidentally grabs it first. Broad
// single-word keywords (like "chicken") are intentionally NOT placed
// on more specific dishes, since they'd shadow other rules further
// down the list (e.g. "chicken" on the biryani rule would also match
// "Chicken Soup" and never let that rule run).
const rules = [
  { keywords: ["vada pav", "vadapav"], image: foodImages.vadaPav },
  { keywords: ["paneer butter masala", "paneer"], image: foodImages.paneerButterMasala },
  { keywords: ["chicken biryani", "biryani"], image: foodImages.chickenBiryani },
  { keywords: ["chicken soup"], image: foodImages.chickenSoup },
  { keywords: ["chocolate cake", "cake"], image: foodImages.chocolateCake },
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
  // generic "chicken" kept last and broad on purpose, so any other
  // chicken dish not covered above still gets *something* better
  // than the blank default
  { keywords: ["chicken"], image: foodImages.chickenBiryani },
];

export function getFoodImage(name = "") {
  const normalized = String(name)
    .toLowerCase()
    .replace(/[-_]/g, " ")   // "chicken-biryani" -> "chicken biryani"
    .replace(/\s+/g, " ")    // collapse repeated spaces
    .trim();

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.image;
    }
  }

  return foodImages.default;
}