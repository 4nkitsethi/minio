// API Service Configuration
// Bind your specific endpoints and data transformation logic here.

const API_CONFIG = {
  baseUrl: 'https://api.white-space.io',
  headers: {
    'Content-Type': 'application/json',
    // 'Authorization': 'Bearer YOUR_TOKEN' // Uncomment if auth is needed
  },
  // Map level keys to specific API paths
  endpoints: {
    catalog: '/catalogs',
    category: '/categories',
    subCategory: '/sub_categories',
    brand: '/brands',
    model: '/models',
    year: '/years',
    color: '/colors',
    uuid: '/utils/generate-uuid'
  }
};

/**
 * Fallback Mock Data Generator
 * Used when the API is unreachable or fails.
 */
const getFallbackSuggestions = async (
  currentLevel: string,
  parentContext: Record<string, string | null>
): Promise<string[]> => {
  // Simulate network latency for realistic feel even in fallback
  await new Promise(resolve => setTimeout(resolve, 400));

  const { catalog, category, subCategory, brand } = parentContext;

  switch (currentLevel) {
    case 'catalog':
      return [
        'Electronics',
        'Automotive',
        'Home & Garden',
        'Fashion',
        'Industrial',
        'Office Supplies'
      ];
    
    case 'category':
      if (catalog === 'Electronics') return ['Smartphones', 'Computers', 'Audio', 'Cameras', 'Wearables'];
      if (catalog === 'Automotive') return ['Car Parts', 'Motorcycle Parts', 'Tools & Equipment', 'Car Care', 'Tires & Wheels'];
      if (catalog === 'Home & Garden') return ['Furniture', 'Kitchen', 'Bedding', 'Decor', 'Garden Tools'];
      if (catalog === 'Fashion') return ['Men', 'Women', 'Kids', 'Accessories', 'Shoes'];
      return ['General Category 1', 'General Category 2', 'General Category 3'];

    case 'subCategory':
      if (category === 'Smartphones') return ['Android Phones', 'iPhones', 'Feature Phones', 'Refurbished Phones'];
      if (category === 'Computers') return ['Laptops', 'Desktops', 'Monitors', 'Tablets', 'Components'];
      if (category === 'Car Parts') return ['Brakes', 'Engine', 'Suspension', 'Exhaust', 'Filters'];
      if (category === 'Furniture') return ['Living Room', 'Bedroom', 'Dining Room', 'Office Furniture'];
      return ['Standard', 'Premium', 'Budget', 'Professional'];

    case 'brand':
      if (catalog === 'Electronics') return ['Samsung', 'Apple', 'Sony', 'LG', 'Dell', 'Asus', 'HP'];
      if (catalog === 'Automotive') return ['Bosch', 'Michelin', 'Castrol', '3M', 'Meguiars', 'Ford', 'Toyota'];
      if (catalog === 'Home & Garden') return ['IKEA', 'Ashley', 'Wayfair', 'Herman Miller', 'KitchenAid'];
      if (catalog === 'Fashion') return ['Nike', 'Adidas', 'Zara', 'Gucci', 'Uniqlo', 'Levis'];
      return ['Acme Corp', 'Generic Brand', 'Premium Co', 'Value Plus'];

    case 'model':
      if (brand) {
          return [
              `${brand} Pro Max`,
              `${brand} Ultra`,
              `${brand} Lite Series`,
              `${brand} Standard Edition`,
              `${brand} X-1000`,
              `${brand} Eco-Line`
          ];
      }
      return ['Model X', 'Model Y', 'Model Z', 'Series 1', 'Series 2'];

    case 'year':
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = 0; i < 15; i++) {
        years.push((currentYear - i + 1).toString());
      }
      return years;

    case 'color':
      if (catalog === 'Automotive') return ['Metallic Black', 'Pearl White', 'Racing Red', 'Midnight Blue', 'Silver Grey', 'Matte Grey'];
      if (catalog === 'Electronics') return ['Space Grey', 'Silver', 'Gold', 'Midnight Green', 'Blue', 'Product Red'];
      if (catalog === 'Furniture') return ['Espresso', 'Oak', 'Walnut', 'White', 'Beige', 'Charcoal'];
      return ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Silver'];

    default:
      return ['Option 1', 'Option 2', 'Option 3'];
  }
};

const getFallbackUUID = async (modelName: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const prefix = modelName 
    ? modelName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() 
    : 'ITM';
    
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  const datePart = new Date().toISOString().slice(2,10).replace(/-/g,'');
  
  return `${prefix}-${datePart}-${randomPart}`;
};

/**
 * Fetches suggestions from the API based on the current level and parent selections.
 */
export const generateSuggestions = async (
  currentLevel: string,
  parentContext: Record<string, string | null>
): Promise<string[]> => {
  
  // 1. Determine the endpoint
  const path = API_CONFIG.endpoints[currentLevel as keyof typeof API_CONFIG.endpoints];
  if (!path) {
    console.warn(`No endpoint configured for level: ${currentLevel}`);
    return getFallbackSuggestions(currentLevel, parentContext);
  }

  // 2. Build Query Parameters from Context
  const params = new URLSearchParams();
  Object.entries(parentContext).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  try {
    // 3. Execute Fetch
    // We add a timeout signal to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const url = `${API_CONFIG.baseUrl}${path}?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Request Failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 4. Transform Data
    if (Array.isArray(data) && typeof data[0] === 'string') {
      return data;
    }
    if (Array.isArray(data) && typeof data[0] === 'object') {
      return data.map((item: any) => item.name || item.label || item.id || JSON.stringify(item));
    }
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((item: any) => typeof item === 'string' ? item : (item.name || item.label));
    }

    return getFallbackSuggestions(currentLevel, parentContext);

  } catch (error) {
    console.warn(`Error fetching ${currentLevel} from API, falling back to mock data.`, error);
    return getFallbackSuggestions(currentLevel, parentContext);
  }
};

/**
 * Generates or fetches a UUID based on the model name.
 */
export const generateUUID = async (modelName: string): Promise<string> => {
  try {
    const path = API_CONFIG.endpoints.uuid;
    const params = new URLSearchParams({ model: modelName || '' });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_CONFIG.baseUrl}${path}?${params.toString()}`, {
      method: 'GET',
      headers: API_CONFIG.headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('UUID generation failed');

    const data = await response.json();
    return data.uuid || data.id || data.serial || getFallbackUUID(modelName);
    
  } catch (error) {
    console.warn("UUID Gen Error (using fallback):", error);
    return getFallbackUUID(modelName);
  }
}