export const MOBILE_MENU_EVENT = "citero:open-mobile-menu";

export function openMobileMenu() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MOBILE_MENU_EVENT));
}
