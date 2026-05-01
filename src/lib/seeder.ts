import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

const DISTRIBUTOR_DATA = {
  DIAGEO: [],
  BACARDI: [],
  PERNOD_RICARD: [],
  ALCHEMY: [],
  COCKTAILS: [],
  MOCKTAILS: []
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

  // Get some item IDs for ingredients
  const spiritsQuery = await getDocs(query(collection(db, 'items'), where('isGlass', '==', false)));
  const itemMap = new Map(spiritsQuery.docs.map(d => [d.data().name.toLowerCase(), d.id]));

  const addRecipeShell = async (name: string, categoryId: string, ingredients: any[] = []) => {
    if (existingRecipeNames.has(name.toLowerCase())) return;
    
    // Resolve ingredient names to IDs
    const resolvedIngredients = ingredients.map(ing => ({
      itemId: itemMap.get(ing.name.toLowerCase()) || '',
      amount: ing.amount
    })).filter(ing => ing.itemId !== '');

    await addDoc(collection(db, 'recipes'), {
      name,
      categoryId,
      ingredients: resolvedIngredients,
      createdBy: userId,
      updatedAt: serverTimestamp()
    });
    existingRecipeNames.add(name.toLowerCase());
  };

  const cocktailRecipes = [
    { name: 'Old Fashioned', ingredients: [{ name: 'Don Julio Reposado', amount: 2 }] },
    { name: 'Negroni', ingredients: [{ name: 'Tanqueray London Dry', amount: 1 }] },
    { name: 'Margarita', ingredients: [{ name: 'Don Julio Blanco', amount: 2 }] },
    { name: 'Espresso Martini', ingredients: [{ name: 'Ketel One Vodka', amount: 1.5 }] },
    { name: 'Whisky Sour', ingredients: [{ name: 'Bulleit Bourbon', amount: 2 }] },
    { name: 'Moscow Mule', ingredients: [{ name: 'Ketel One Vodka', amount: 1.5 }] },
    { name: 'Pina Colada', ingredients: [{ name: 'Bacardi Carta Blanca', amount: 2 }] },
  ];

  for (const name of DISTRIBUTOR_DATA.COCKTAILS) {
    await addItem(name, COCKTAIL_CAT, 'oz', true);
    const complex = cocktailRecipes.find(r => r.name === name);
    await addRecipeShell(name, COCKTAIL_CAT, complex ? complex.ingredients : []);
  }
  for (const name of DISTRIBUTOR_DATA.MOCKTAILS) {
    await addItem(name, MOCKTAIL_CAT, 'oz', true);
    await addRecipeShell(name, MOCKTAIL_CAT);
  }
};
