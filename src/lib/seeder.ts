import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

const DISTRIBUTOR_DATA = {
  DIAGEO: [
    'Johnnie Walker Black Label', 'Johnnie Walker Blue Label', 'Johnnie Walker Gold Label', 
    'Talisker 10Y', 'Singleton 12Y', 'Singleton 15Y', 'Singleton 18Y', 'Lagavulin 16Y',
    'Tanqueray Ten', 'Tanqueray London Dry', 'Ketel One Vodka', 'Ciroc Vodka', 'Don Julio Blanco',
    'Don Julio Reposado', 'Don Julio 1942', 'Bulleit Bourbon', 'Bulleit Rye', 'Zacapa 23', 'Zacapa XO'
  ],
  BACARDI: [
    'Bacardi Carta Blanca', 'Bacardi Diez', 'Bacardi Ocho', 'Grey Goose Vodka', 
    'Bombay Sapphire', 'Patron Silver', 'Patron Reposado', 'Patron Anejo', 'Dewars 12Y', 
    'Dewars 15Y', 'Dewars 18Y', 'Aberfeldy 12Y', 'Santa Teresa 1796'
  ],
  PERNOD_RICARD: [
    'Chivas Regal 12Y', 'Chivas Regal 18Y', 'Chivas Royal Salute 21Y', 'The Glenlivet 12Y',
    'The Glenlivet 15Y', 'The Glenlivet 18Y', 'Absolut Vodka', 'Beefeater Gin', 'Jameson Irish Whiskey',
    'Martell VSOP', 'Martell Cordon Bleu', 'Monkey 47 Gin', 'Havana Club 7Y', 'Malibu'
  ],
  ALCHEMY: [
    'Ardbeg 10Y', 'Ardbeg Uigeadail', 'Glenmorangie 10Y', 'Glenmorangie Lasanta', 
    'Hennessy VSOP', 'Hennessy XO', 'Belvedere Vodka', 'Volcan Tequila Blanco', 
    'Moet & Chandon Brut', 'Veuve Clicquot Yellow Label'
  ],
  COCKTAILS: [
    'Old Fashioned', 'Negroni', 'Margarita', 'Espresso Martini', 'Whisky Sour', 
    'Moscow Mule', 'Pina Colada', 'Mai Tai', 'Cosmopolitan', 'Manhattan', 
    'Aperol Spritz', 'Hugo Spritz', 'Ardbeg Sour', 'Bulleit Old Fashioned'
  ],
  MOCKTAILS: [
    'Virgin Mojito', 'Virgin Pina', 'Chameleon', 'Euphoria', 'Tease-Apples', 
    'Berry Mule', 'Zest', 'Blossom', 'Oaky Lane'
  ]
};

export const seedDatabase = async (userId: string) => {
  const existingItemsQuery = await getDocs(collection(db, 'items'));
  const existingNames = new Set(existingItemsQuery.docs.map(d => d.data().name.toLowerCase()));

  const categoriesQuery = await getDocs(collection(db, 'categories'));
  const categoryMap = new Map(categoriesQuery.docs.map(d => [d.data().name.toUpperCase(), d.id]));

  const ensureCategory = async (name: string, type: 'spirit' | 'wine' | 'soft_drink' | 'other' = 'spirit') => {
    const upperName = name.toUpperCase();
    if (categoryMap.has(upperName)) return categoryMap.get(upperName)!;
    
    const docRef = await addDoc(collection(db, 'categories'), {
      name,
      type,
      createdBy: userId,
      updatedAt: serverTimestamp()
    });
    categoryMap.set(upperName, docRef.id);
    return docRef.id;
  };

  const addItem = async (name: string, categoryId: string, unit: string = 'oz', isGlass: boolean = false) => {
    const searchName = isGlass ? `${name} (Glass)`.toLowerCase() : name.toLowerCase();
    if (existingNames.has(searchName)) return;

    await addDoc(collection(db, 'items'), {
      name: isGlass ? `${name} (Glass)` : name,
      categoryId,
      unit,
      parLevel: isGlass ? 10 : 4,
      currentStock: 0,
      isGlass,
      createdBy: userId,
      updatedAt: serverTimestamp()
    });
    existingNames.add(searchName);
  };

  const WHISKY_CAT = await ensureCategory('Whisky', 'spirit');
  const GIN_CAT = await ensureCategory('Gin', 'spirit');
  const VODKA_CAT = await ensureCategory('Vodka', 'spirit');
  const TEQUILA_CAT = await ensureCategory('Tequila', 'spirit');
  const RUM_CAT = await ensureCategory('Rum', 'spirit');
  const COCKTAIL_CAT = await ensureCategory('Cocktail', 'other');
  const MOCKTAIL_CAT = await ensureCategory('Mocktail', 'other');

  // Seed Spirits
  for (const name of DISTRIBUTOR_DATA.DIAGEO) {
    let cat = WHISKY_CAT;
    if (name.includes('Tanqueray')) cat = GIN_CAT;
    if (name.includes('Vodka')) cat = VODKA_CAT;
    if (name.includes('Don Julio')) cat = TEQUILA_CAT;
    if (name.includes('Zacapa')) cat = RUM_CAT;
    await addItem(name, cat, 'btl', false);
    await addItem(name, cat, 'oz', true);
  }

  for (const name of DISTRIBUTOR_DATA.BACARDI) {
    let cat = RUM_CAT;
    if (name.includes('Goose')) cat = VODKA_CAT;
    if (name.includes('Bombay')) cat = GIN_CAT;
    if (name.includes('Patron')) cat = TEQUILA_CAT;
    if (name.includes('Dewars') || name.includes('Aberfeldy')) cat = WHISKY_CAT;
    await addItem(name, cat, 'btl', false);
    await addItem(name, cat, 'oz', true);
  }

  for (const name of DISTRIBUTOR_DATA.PERNOD_RICARD) {
    let cat = WHISKY_CAT;
    if (name.includes('Gin')) cat = GIN_CAT;
    if (name.includes('Absolut')) cat = VODKA_CAT;
    if (name.includes('Havana') || name.includes('Malibu')) cat = RUM_CAT;
    await addItem(name, cat, 'btl', false);
    await addItem(name, cat, 'oz', true);
  }

  for (const name of DISTRIBUTOR_DATA.ALCHEMY) {
    let cat = WHISKY_CAT;
    if (name.includes('Hennessy')) cat = await ensureCategory('Cognac', 'spirit');
    if (name.includes('Belvedere')) cat = VODKA_CAT;
    if (name.includes('Tequila')) cat = TEQUILA_CAT;
    await addItem(name, cat, 'btl', false);
    await addItem(name, cat, 'oz', true);
  }

  // Seed Sales Items (Glass)
  const existingRecipesQuery = await getDocs(collection(db, 'recipes'));
  const existingRecipeNames = new Set(existingRecipesQuery.docs.map(d => d.data().name.toLowerCase()));

  const addRecipeShell = async (name: string, categoryId: string) => {
    if (existingRecipeNames.has(name.toLowerCase())) return;
    await addDoc(collection(db, 'recipes'), {
      name,
      categoryId,
      ingredients: [],
      createdBy: userId,
      updatedAt: serverTimestamp()
    });
    existingRecipeNames.add(name.toLowerCase());
  };

  for (const name of DISTRIBUTOR_DATA.COCKTAILS) {
    await addItem(name, COCKTAIL_CAT, 'oz', true);
    await addRecipeShell(name, COCKTAIL_CAT);
  }
  for (const name of DISTRIBUTOR_DATA.MOCKTAILS) {
    await addItem(name, MOCKTAIL_CAT, 'oz', true);
    await addRecipeShell(name, MOCKTAIL_CAT);
  }
};
