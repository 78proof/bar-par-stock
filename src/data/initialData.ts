
export interface SeedItem {
  name: string;
  categoryName: string;
  isGlass: boolean;
  price?: number;
  group: string;
}

export const salesData: SeedItem[] = [
  // Whisky
  { name: 'DEWARS 12 YRS', categoryName: 'Whisky', isGlass: true, price: 800, group: 'WHISKY' },
  { name: 'GLENFID18Y', categoryName: 'Whisky', isGlass: true, price: 1091, group: 'WHISKY' },
  { name: 'JW GOLD LABEL', categoryName: 'Whisky', isGlass: true, price: 1000, group: 'WHISKY' },
  { name: 'HIBIKI HARMONY', categoryName: 'Whisky', isGlass: true, price: 1500, group: 'WHISKY' },
  { name: 'DEWARS 18', categoryName: 'Whisky', isGlass: true, price: 1100, group: 'WHISKY' },
  { name: 'JW 18 YRS', categoryName: 'Whisky', isGlass: true, price: 1400, group: 'WHISKY' },
  { name: 'MAKER S MARK', categoryName: 'Whisky', isGlass: true, price: 1092, group: 'WHISKY' },
  { name: 'YAMAZAKI 12 YRS', categoryName: 'Whisky', isGlass: true, price: 2500, group: 'WHISKY' },
  { name: 'WILD TURKEY BOUR', categoryName: 'Whisky', isGlass: true, price: 1100, group: 'WHISKY' },
  { name: 'GLENFID18 Y BTL', categoryName: 'Whisky', isGlass: false, price: 16000, group: 'WHISKY' },
  { name: 'JW GOLD', categoryName: 'Whisky', isGlass: true, price: 1000, group: 'WHISKY' },
  { name: 'TALISKER 10', categoryName: 'Whisky', isGlass: true, price: 1100, group: 'WHISKY' },
  { name: 'SINGLETON 15', categoryName: 'Whisky', isGlass: true, price: 1168, group: 'WHISKY' },
  { name: 'WOODFORD RESERVE', categoryName: 'Whisky', isGlass: true, price: 1300, group: 'WHISKY' },
  { name: 'MICHTER BOURBON', categoryName: 'Whisky', isGlass: true, price: 1400, group: 'WHISKY' },
  { name: 'SINGLETON 12', categoryName: 'Whisky', isGlass: true, price: 1000, group: 'WHISKY' },
  { name: 'MC 18Y DB CASK', categoryName: 'Whisky', isGlass: true, price: 4350, group: 'WHISKY' },
  { name: 'ARDBEG 10 YRS', categoryName: 'Whisky', isGlass: true, price: 1100, group: 'WHISKY' },
  { name: 'KAVALAN NO.1', categoryName: 'Whisky', isGlass: true, price: 1050, group: 'WHISKY' },
  { name: 'KAVALAN SHERRY', categoryName: 'Whisky', isGlass: true, price: 1129, group: 'WHISKY' },
  { name: 'BULLEIT RYE', categoryName: 'Whisky', isGlass: true, price: 1000, group: 'WHISKY' },
  { name: 'FROM BARREL NIKKA', categoryName: 'Whisky', isGlass: true, price: 1400, group: 'WHISKY' },
  { name: 'LAGAVULIN 16', categoryName: 'Whisky', isGlass: true, price: 1800, group: 'WHISKY' },
  { name: 'JACK DANIELS', categoryName: 'Whisky', isGlass: true, price: 778, group: 'WHISKY' },
  { name: 'DEWARS 15 YRS', categoryName: 'Whisky', isGlass: true, price: 1000, group: 'WHISKY' },
  { name: 'MC 18 Y SHERRY', categoryName: 'Whisky', isGlass: true, price: 3692, group: 'WHISKY' },
  { name: 'JACK DANIELS BTL', categoryName: 'Whisky', isGlass: false, price: 11925, group: 'WHISKY' },
  { name: 'BUSHMILLS 12YRS', categoryName: 'Whisky', isGlass: true, price: 1100, group: 'WHISKY' },
  { name: 'YAMAZAKI 25 YRS', categoryName: 'Whisky', isGlass: true, price: 22400, group: 'WHISKY' }, // Price is high but not marked BTL, maybe glass of super premium? Actually user said check price. 22k is definitely BTL.
  { name: 'GLEKINCHIE 12', categoryName: 'Whisky', isGlass: true, price: 1300, group: 'WHISKY' },
  { name: 'HAKUSHU 12 YRS', categoryName: 'Whisky', isGlass: true, price: 3230, group: 'WHISKY' },
  { name: 'WILD TURKEY RYE', categoryName: 'Whisky', isGlass: true, price: 1100, group: 'WHISKY' },
  { name: 'ICHIRO CHICHIBU', categoryName: 'Whisky', isGlass: true, price: 1300, group: 'WHISKY' },
  { name: 'YAMAZAKI 12 YRS BTL', categoryName: 'Whisky', isGlass: false, price: 36350, group: 'WHISKY' },
  { name: 'BUSHMILLS BLACK', categoryName: 'Whisky', isGlass: true, price: 1100, group: 'WHISKY' },
  { name: 'JW BLUE LABEL', categoryName: 'Whisky', isGlass: true, price: 3000, group: 'WHISKY' },
  { name: 'SINGLETON 15 BTL', categoryName: 'Whisky', isGlass: false, price: 16500, group: 'WHISKY' },
  { name: 'KAVALAN PORT C', categoryName: 'Whisky', isGlass: true, price: 1150, group: 'WHISKY' },
  { name: 'CHIVAS ULTIS', categoryName: 'Whisky', isGlass: true, price: 3500, group: 'WHISKY' },
  { name: 'ABERLOUR 18', categoryName: 'Whisky', isGlass: true, price: 2500, group: 'WHISKY' },
  { name: 'JW GOLD BTL', categoryName: 'Whisky', isGlass: false, price: 15000, group: 'WHISKY' },
  { name: 'MACALLAN NIGHT', categoryName: 'Whisky', isGlass: true, price: 2500, group: 'WHISKY' },
  { name: 'SINGLETON 12 BTL', categoryName: 'Whisky', isGlass: false, price: 14000, group: 'WHISKY' },
  { name: 'GLENFID21Y', categoryName: 'Whisky', isGlass: true, price: 2750, group: 'WHISKY' },
  { name: 'HIGHLANDG 12YRS', categoryName: 'Whisky', isGlass: true, price: 1400, group: 'WHISKY' },
  { name: 'CHIVAS ROYAL 100', categoryName: 'Whisky', isGlass: true, price: 3000, group: 'WHISKY' },
  { name: 'JW KING GEORGE', categoryName: 'Whisky', isGlass: true, price: 4000, group: 'WHISKY' },
  { name: 'WOODFORD RYE', categoryName: 'Whisky', isGlass: true, price: 1300, group: 'WHISKY' },
  { name: 'HIGHLAND 18YRS', categoryName: 'Whisky', isGlass: true, price: 2800, group: 'WHISKY' },
  { name: 'MICHTER RYE', categoryName: 'Whisky', isGlass: true, price: 1400, group: 'WHISKY' },
  { name: 'HIBIKI 21 YRS', categoryName: 'Whisky', isGlass: true, price: 9500, group: 'WHISKY' },
  { name: 'DEWAR DB 32 TRS', categoryName: 'Whisky', isGlass: true, price: 6000, group: 'WHISKY' },
  { name: 'DEWARS 18 BTL', categoryName: 'Whisky', isGlass: false, price: 17250, group: 'WHISKY' },
  { name: 'MIYAGIKYO NIKKA', categoryName: 'Whisky', isGlass: true, price: 1800, group: 'WHISKY' },
  { name: 'MACALLAN HARMONY', categoryName: 'Whisky', isGlass: true, price: 3500, group: 'WHISKY' },
  { name: 'TAKETSURU NIKKA', categoryName: 'Whisky', isGlass: true, price: 1700, group: 'WHISKY' },
  { name: 'GLENFARCLAS 25', categoryName: 'Whisky', isGlass: true, price: 3000, group: 'WHISKY' },
  { name: 'GLENFID30Y', categoryName: 'Whisky', isGlass: true, price: 4000, group: 'WHISKY' },
  { name: 'MC RARE CASK', categoryName: 'Whisky', isGlass: true, price: 4000, group: 'WHISKY' },
  { name: 'HIGHLAND 15YRS', categoryName: 'Whisky', isGlass: true, price: 1800, group: 'WHISKY' },
  { name: 'MC RICH CACAO', categoryName: 'Whisky', isGlass: true, price: 3400, group: 'WHISKY' },
  { name: 'ICHIRO MIZUNARA', categoryName: 'Whisky', isGlass: true, price: 3200, group: 'WHISKY' },
  { name: 'GLENLIVET SINGLE', categoryName: 'Whisky', isGlass: true, price: 2650, group: 'WHISKY' },
  { name: 'BUILLET BOURBON', categoryName: 'Whisky', isGlass: true, price: 900, group: 'WHISKY' },
  { name: 'CANADIAN C', categoryName: 'Whisky', isGlass: true, price: 790, group: 'WHISKY' },
  { name: 'GLENLIVET 18 YEARS', categoryName: 'Whisky', isGlass: true, price: 1200, group: 'WHISKY' },

  // GIN
  { name: 'HENDRICK\'S', categoryName: 'Gin', isGlass: true, price: 1193, group: 'GIN' },
  { name: 'G.ROKU', categoryName: 'Gin', isGlass: true, price: 1192, group: 'GIN' },
  { name: 'TANQUERAY TEN', categoryName: 'Gin', isGlass: true, price: 1400, group: 'GIN' },
  { name: 'G. NO.3', categoryName: 'Gin', isGlass: true, price: 1400, group: 'GIN' },
  { name: 'ROKU BTL', categoryName: 'Gin', isGlass: false, price: 17500, group: 'GIN' },
  { name: 'BOMBAY SAPPHIRE BTL', categoryName: 'Gin', isGlass: false, price: 17250, group: 'GIN' },
  { name: 'BOMBAY', categoryName: 'Gin', isGlass: true, price: 1100, group: 'GIN' },
  { name: 'G.TANQUERAY', categoryName: 'Gin', isGlass: true, price: 1100, group: 'GIN' },

  // VODKA
  { name: 'G.GREY GOOSE', categoryName: 'Vodka', isGlass: true, price: 1100, group: 'VODKA' },
  { name: 'CIROC VODKA', categoryName: 'Vodka', isGlass: true, price: 1200, group: 'VODKA' },
  { name: 'G.STOLI ELYT', categoryName: 'Vodka', isGlass: true, price: 1200, group: 'VODKA' },
  { name: 'GREY GOOSE BTL', categoryName: 'Vodka', isGlass: false, price: 17250, group: 'VODKA' },
  { name: 'STOLICHNA ELIT BTL', categoryName: 'Vodka', isGlass: false, price: 17500, group: 'VODKA' },

  // TEQUILA
  { name: 'DON JULIO RESPOSADO', categoryName: 'Tequila', isGlass: true, price: 1000, group: 'TEQUILA' },
  { name: 'AZUL REPOSADO', categoryName: 'Tequila', isGlass: true, price: 1500, group: 'TEQUILA' },
  { name: 'DON JULIO 1942', categoryName: 'Tequila', isGlass: true, price: 3000, group: 'TEQUILA' },
  { name: 'DON JULIO R.BTL', categoryName: 'Tequila', isGlass: false, price: 15466, group: 'TEQUILA' },
  { name: 'MONTELOBOS', categoryName: 'Tequila', isGlass: true, price: 1200, group: 'TEQUILA' },
  { name: 'PATRON REPOSADO', categoryName: 'Tequila', isGlass: true, price: 1100, group: 'TEQUILA' },
  { name: '1800 CRISTALINO', categoryName: 'Tequila', isGlass: true, price: 1200, group: 'TEQUILA' },
  { name: 'AZUL GOLD', categoryName: 'Tequila', isGlass: true, price: 3500, group: 'TEQUILA' },
  { name: 'AZUL ANEJO', categoryName: 'Tequila', isGlass: true, price: 6800, group: 'TEQUILA' },

  // RUM
  { name: 'BACARDI DIEZ', categoryName: 'Rum', isGlass: true, price: 1000, group: 'RUM' },
  { name: 'ZACAPA 23', categoryName: 'Rum', isGlass: true, price: 1400, group: 'RUM' },
  { name: 'BACARDI DIEZ BTL', categoryName: 'Rum', isGlass: false, price: 15250, group: 'RUM' },
  { name: 'XO PLANTATION', categoryName: 'Rum', isGlass: true, price: 1200, group: 'RUM' },
  { name: 'G.MATUSALEM 23', categoryName: 'Rum', isGlass: true, price: 1400, group: 'RUM' },

  // COGNAC
  { name: 'HENNESSY V.S.O.P.', categoryName: 'Cognac', isGlass: true, price: 1189, group: 'COGNAC' },
  { name: 'REMY MARTIN VSOP', categoryName: 'Cognac', isGlass: true, price: 1100, group: 'COGNAC' },
  { name: 'HENNESSY X.O.', categoryName: 'Cognac', isGlass: true, price: 1900, group: 'COGNAC' },
  { name: 'REMY MARTIN X.O. BTL', categoryName: 'Cognac', isGlass: false, price: 31250, group: 'COGNAC' },
  { name: 'HENNESSY V.S.O.P.BTL', categoryName: 'Cognac', isGlass: false, price: 17150, group: 'COGNAC' },
  { name: 'REMY MARTIN XO', categoryName: 'Cognac', isGlass: true, price: 2000, group: 'COGNAC' },
  { name: 'REMY MARTIN VSOP BTL', categoryName: 'Cognac', isGlass: false, price: 16000, group: 'COGNAC' },
  { name: 'MARTELL NOBLIGE', categoryName: 'Cognac', isGlass: true, price: 1200, group: 'COGNAC' },

  // WINES (White)
  { name: 'G.CRAGGY RANGE SB', categoryName: 'White Wine', isGlass: true, price: 1002, group: 'W/W GLASS' },
  { name: 'G.P.GRIGIO TERLA', categoryName: 'White Wine', isGlass: true, price: 995, group: 'W/W GLASS' },
  { name: 'G.SANCERRE VACHE', categoryName: 'White Wine', isGlass: true, price: 1136, group: 'W/W GLASS' },
  { name: 'G.OTT MIREILLE', categoryName: 'White Wine', isGlass: true, price: 1100, group: 'W/W GLASS' },
  { name: 'G.DROIN CHABLIS', categoryName: 'White Wine', isGlass: true, price: 1500, group: 'W/W GLASS' },
  { name: 'G.LOS ALAMOS', categoryName: 'White Wine', isGlass: true, price: 1500, group: 'W/W GLASS' },
  { name: 'G.PIUZE CHAPELLE', categoryName: 'White Wine', isGlass: true, price: 1400, group: 'W/W GLASS' },
  { name: 'G.SAVENNIERES', categoryName: 'White Wine', isGlass: true, price: 1700, group: 'W/W GLASS' },
  { name: 'G.PIUZE CORNASSE', categoryName: 'White Wine', isGlass: true, price: 1400, group: 'W/W GLASS' },
  { name: 'CRAGGY RANGE SB', categoryName: 'White Wine', isGlass: false, price: 5015, group: 'W/W NEW ZEALAND' },
  { name: 'TERLAN PINOT GRIGIO', categoryName: 'White Wine', isGlass: false, price: 4960, group: 'W/W TRENTINO' },

  // Champagne
  { name: 'G.BOLLINGER SPECIAL CUVEE', categoryName: 'Champagne', isGlass: true, price: 2200, group: 'CHAMPAGNE GLASS' },
  { name: 'G.BILLECART BRUT', categoryName: 'Champagne', isGlass: true, price: 1939, group: 'CHAMPAGNE GLASS' },
  { name: 'G.AYALA BRUT', categoryName: 'Champagne', isGlass: true, price: 1911, group: 'CHAMPAGNE GLASS' },
  { name: 'BOLLINGER SPECIAL CUVEE', categoryName: 'Champagne', isGlass: false, price: 10800, group: 'CHAMPAGNE MEZ' },
  { name: 'BILLECART RESERVE', categoryName: 'Champagne', isGlass: false, price: 9800, group: 'CHAMPAGNE MEZ' },

  // Red Wine
  { name: 'G.HENRY SEVEN 23', categoryName: 'Red Wine', isGlass: true, price: 1124, group: 'R/W GLASS' },
  { name: 'G.PN BARDA 2022', categoryName: 'Red Wine', isGlass: true, price: 1400, group: 'R/W GLASS' },
  { name: 'G.PAGODES COS 17', categoryName: 'Red Wine', isGlass: true, price: 1595, group: 'R/W GLASS' },
  { name: 'G.PN BARDA PATAG', categoryName: 'Red Wine', isGlass: true, price: 1379, group: 'R/W GLASS' },
  { name: 'G.MOUTON ROTHSCHILD 21', categoryName: 'Red Wine', isGlass: true, price: 7000, group: 'R/W GLASS' },

  // Rose Wine
  { name: 'G.MINUTY ROSE OR', categoryName: 'Rose Wine', isGlass: true, price: 1212, group: 'W/W GLASS' }, // Minuty Rose is usually rose
  { name: 'G.MINUTY PRESTIG', categoryName: 'Rose Wine', isGlass: true, price: 975, group: 'ROSE/W GLASS' },
  { name: 'G.PETALE DE ROSE', categoryName: 'Rose Wine', isGlass: true, price: 950, group: 'ROSE/W GLASS' },
  { name: 'G.CIBONNE TENTATION', categoryName: 'Rose Wine', isGlass: true, price: 950, group: 'ROSE/W GLASS' },

  // Soft Drinks
  { name: 'COKE', categoryName: 'Soft Drink', isGlass: false, price: 384, group: 'SOFT DRINK' },
  { name: 'COKE ZERO', categoryName: 'Soft Drink', isGlass: false, price: 490, group: 'SOFT DRINK' },
  { name: 'SPRITE', categoryName: 'Soft Drink', isGlass: false, price: 490, group: 'SOFT DRINK' },
  { name: 'GINGER ALE', categoryName: 'Soft Drink', isGlass: false, price: 490, group: 'SOFT DRINK' },
  { name: 'SODA WATER', categoryName: 'Soft Drink', isGlass: false, price: 490, group: 'SOFT DRINK' },
  { name: 'TONIC WATER', categoryName: 'Soft Drink', isGlass: false, price: 490, group: 'SOFT DRINK' },
  { name: 'GINGER BEER', categoryName: 'Soft Drink', isGlass: false, price: 490, group: 'SOFT DRINK' },

  // Water
  { name: 'EVIAN.STILL', categoryName: 'Mineral Water', isGlass: false, price: 450, group: 'MINERAL WATER' },
  { name: 'EVIAN STILL SM', categoryName: 'Mineral Water', isGlass: false, price: 300, group: 'MINERAL WATER' },
  { name: 'EVAN.SPARKLING', categoryName: 'Mineral Water', isGlass: false, price: 444, group: 'MINERAL WATER' },
  { name: 'EVIAN SPARK SM', categoryName: 'Mineral Water', isGlass: false, price: 300, group: 'MINERAL WATER' },

  // Liqueur
  { name: 'JAGERMEISTER', categoryName: 'Liqueur', isGlass: true, price: 800, group: 'LIQUR' },
  { name: 'BAILEY\'S', categoryName: 'Liqueur', isGlass: true, price: 807, group: 'LIQUR' },
  { name: 'AMARETTO', categoryName: 'Liqueur', isGlass: true, price: 800, group: 'LIQUR' },
  { name: 'KAHLUA', categoryName: 'Liqueur', isGlass: true, price: 800, group: 'LIQUR' },

  // COCKTAILS
  { name: 'OLD FASHIONED', categoryName: 'COCKTAIL', isGlass: true, group: 'COCKTAIL' },
  { name: 'NEGRONI', categoryName: 'COCKTAIL', isGlass: true, group: 'COCKTAIL' },
  { name: 'MARGARITA', categoryName: 'COCKTAIL', isGlass: true, group: 'COCKTAIL' },
  { name: 'ESPRESSO MARTINI', categoryName: 'COCKTAIL', isGlass: true, group: 'COCKTAIL' },
  { name: 'WHISKY SOUR', categoryName: 'COCKTAIL', isGlass: true, group: 'COCKTAIL' },
  { name: 'PORNSTARTINI', categoryName: 'COCKTAIL', isGlass: true, group: 'COCKTAIL' },
  { name: 'APEROL SPRITZ', categoryName: 'COCKTAIL', isGlass: true, group: 'COCKTAIL' },
  { name: 'MOJITO', categoryName: 'COCKTAIL', isGlass: true, group: 'COCKTAIL' },
  { name: 'HUGO SPRITZ', categoryName: 'COCKTAIL', isGlass: true, group: 'COCKTAIL' },
  { name: 'DOME266', categoryName: 'COCKTAIL', isGlass: true, group: 'COCKTAIL' },

  // MOCKTAILS
  { name: 'CHAMELEON', categoryName: 'NON-ALCOHOL', isGlass: true, group: 'BEVERAGE' },
  { name: 'EUPHORIA', categoryName: 'NON-ALCOHOL', isGlass: true, group: 'BEVERAGE' },
  { name: 'VIRGIN MOJITO', categoryName: 'NON-ALCOHOL', isGlass: true, group: 'BEVERAGE' },
  { name: 'ZEST', categoryName: 'NON-ALCOHOL', isGlass: true, group: 'BEVERAGE' },

  // SPIRITS ADDITIONS
  { name: 'TANQUERAY TEN', categoryName: 'Gin', isGlass: true, group: 'GIN' },
  { name: 'ROKU', categoryName: 'Gin', isGlass: true, group: 'GIN' },
  { name: 'GREY GOOSE', categoryName: 'Vodka', isGlass: true, group: 'VODKA' },
  { name: 'BELVEDERE', categoryName: 'Vodka', isGlass: true, group: 'VODKA' },
  { name: 'DON JULIO 1942', categoryName: 'Tequila', isGlass: true, group: 'TEQUILA' },
  { name: 'CLASE AZUL REPOSADO', categoryName: 'Tequila', isGlass: true, group: 'TEQUILA' },
  { name: 'MACALLAN 12Y', categoryName: 'Whisky', isGlass: true, group: 'WHISKY' },
  { name: 'GLENFIDDICH 12Y', categoryName: 'Whisky', isGlass: true, group: 'WHISKY' },
  { name: 'SINGLETON 12Y', categoryName: 'Whisky', isGlass: true, group: 'WHISKY' },
  { name: 'HENNESSY XO', categoryName: 'Cognac', isGlass: true, group: 'COGNAC' },
];
