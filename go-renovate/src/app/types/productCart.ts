import { CartItem } from "@/app/types/vendor";

// One line in the shop cart (products bought from vendor pages). The cart spans vendors; checkout
// sends only the id and quantity to the server, which prices everything itself.
export interface ProductCartItem {
  essentialId: string;
  name: string;
  price: number;
  imageUrl?: string;
  vendorId: string;
  vendorName: string;
  // The product's category on the vendor page (its slot name, e.g. "Sofa").
  categoryLabel: string;
  quantity: number;
  // How many can be bought at once (stock, capped like rooms); refreshed whenever the cart is checked.
  maxQuantity: number;
}

// The shape CartDrawer already draws (shared with the services cart). The vendor goes in the small
// category line so a cart spanning vendors stays readable.
export function toDrawerItem(item: ProductCartItem): CartItem {
  return {
    service: {
      id: item.essentialId,
      name: item.name,
      description: "",
      price: item.price,
      imageUrl: item.imageUrl,
      product: {
        slot: item.categoryLabel,
        stock: item.maxQuantity,
        purchaseMode: "on-platform",
      },
    },
    categoryLabel: `${item.vendorName} · ${item.categoryLabel}`,
    quantity: item.quantity,
  };
}
