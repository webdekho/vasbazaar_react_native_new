/**
 * Image mapping object that provides centralized access to application icons.
 * Contains mappings for service icons, operator logos, and utility images.
 * 
 * @module imageMap
 * @type {Object.<string, any>}
 * 
 * @example
 * // Import and use specific icon
 * import imageMap from './icons';
 * <Image source={imageMap['recharge']} />
 * 
 * @example
 * // Dynamic icon selection
 * const iconSource = imageMap[operatorCode] || imageMap['default'];
 */
const imageMap = {
  /** @description Mobile recharge service icon */
  "recharge": require("../../assets/icons/recharge.png"),
  
  /** @description Bill payment service icon */
  "bill": require("../../assets/icons/bill.png"),
  
  /** @description DTH recharge service icon */
  "dth": require("../../assets/icons/dth.png"),
  
  /** @description Electricity bill payment icon */
  "electricity-bill": require("../../assets/icons/electricity-bill.png"),
  
  /** @description FASTag recharge service icon */
  "fasttag": require("../../assets/icons/fasttag.png"),
  
  /** @description Landline bill payment icon */
  "landline": require("../../assets/icons/landline.png"),
  
  /** @description Gas cylinder booking icon */
  "gas-cylinder": require("../../assets/icons/gas-cylinder.png"),
  
  /** @description Credit card bill payment icon */
  "credit-card": require("../../assets/icons/credit-card.png"),
  
  /** @description Vi (Vodafone Idea) operator logo */
  "vi": require("../../assets/icons/vi.png"),
  
  /** @description Airtel operator logo */
  "airtel": require("../../assets/icons/airtel.png"),
  
  /** @description Jio operator logo */
  "jio": require("../../assets/icons/jio.png"),
  
  /** @description BSNL operator logo */
  "bsnl": require("../../assets/icons/bsnl.png"),
  
  /** @description MTNL operator logo */
  "mtnl": require("../../assets/icons/mtnl.png"),
  
  /** @description Maharashtra electricity board logo */
  "mahavitaran": require("../../assets/icons/mahavitaran.png"),
  
  /** @description Bharat Connect service logo */
  "bharat_connect": require("../../assets/icons/bharat_connect.png"),
};

export default imageMap;