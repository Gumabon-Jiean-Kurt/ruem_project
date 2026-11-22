const SAVE_KEY = 'miniArcadeSave_v1';
const CATEGORIES = [
  { id: 'all', label: 'All pieces' },
  { id: 'shirts', label: 'Shirts' },
  { id: 'hair', label: 'Hair' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'pants', label: 'Pants' },
  { id: 'accessories', label: 'Accessories' }
];
const ITEMS = [
  { id: 'shirt-classic', name: 'Sunday Tee', category: 'shirts', icon: '👕', description: 'A comfy everyday favorite', price: 0, tint: 'rgba(255, 184, 159, .26)' },
  { id: 'shirt-berry', name: 'Berry Knit', category: 'shirts', icon: '🧶', description: 'Soft, sweet, and cozy', price: 12, tint: 'rgba(242, 117, 153, .25)' },
  { id: 'shirt-sailor', name: 'Little Sailor', category: 'shirts', icon: '⚓', description: 'Ready for a seaside stroll', price: 16, tint: 'rgba(111, 178, 219, .27)' },
  { id: 'shirt-sunshine', name: 'Sunshine Hoodie', category: 'shirts', icon: '🌞', description: 'A pocketful of sunshine', price: 18, tint: 'rgba(255, 208, 99, .28)' },
  { id: 'shirt-flower', name: 'Petal Party', category: 'shirts', icon: '🌼', description: 'Made for a garden day', price: 20, tint: 'rgba(141, 206, 147, .26)' },
  { id: 'shirt-star', name: 'Starry Pajamas', category: 'shirts', icon: '🌙', description: 'Dreamy bedtime style', price: 22, tint: 'rgba(160, 147, 226, .28)' },

  { id: 'hair-bow', name: 'Peachy Bow', category: 'hair', icon: '🎀', description: 'A tiny finishing touch', price: 8, tint: 'rgba(255, 144, 174, .28)' },
  { id: 'hair-sun', name: 'Sunbeam Clip', category: 'hair', icon: '🌻', description: 'A little golden glow', price: 10, tint: 'rgba(255, 199, 94, .28)' },
  { id: 'hair-cloud', name: 'Cloud Fluff', category: 'hair', icon: '☁️', description: 'Soft as a daydream', price: 12, tint: 'rgba(173, 194, 238, .28)' },
  { id: 'hair-crown', name: 'Tiny Crown', category: 'hair', icon: '👑', description: 'Royalty looks good on you', price: 18, tint: 'rgba(247, 204, 99, .3)' },
  { id: 'hair-star', name: 'Starlight Pins', category: 'hair', icon: '✨', description: 'A sprinkle of sparkle', price: 15, tint: 'rgba(189, 154, 255, .3)' },

  { id: 'shoes-sneakers', name: 'Comfy Kicks', category: 'shoes', icon: '👟', description: 'For all-day adventures', price: 14, tint: 'rgba(111, 178, 219, .28)' },
  { id: 'shoes-rainboots', name: 'Rainy Day Boots', category: 'shoes', icon: '🥾', description: 'Puddle-jumping approved', price: 16, tint: 'rgba(120, 194, 168, .28)' },
  { id: 'shoes-slippers', name: 'Bunny Slippers', category: 'shoes', icon: '🐰', description: 'Extra cozy at home', price: 12, tint: 'rgba(239, 167, 193, .28)' },
  { id: 'shoes-skates', name: 'Roller Stars', category: 'shoes', icon: '🛼', description: 'Roll into the spotlight', price: 20, tint: 'rgba(191, 142, 236, .3)' },
  { id: 'shoes-sandals', name: 'Sunny Sandals', category: 'shoes', icon: '🩴', description: 'Easy summer strolls', price: 10, tint: 'rgba(255, 192, 119, .28)' },

  { id: 'pants-overalls', name: 'Garden Overalls', category: 'pants', icon: '👖', description: 'Room for one more snack', price: 15, tint: 'rgba(105, 163, 209, .28)' },
  { id: 'pants-shorts', name: 'Picnic Shorts', category: 'pants', icon: '🩳', description: 'Made for sunny afternoons', price: 11, tint: 'rgba(255, 183, 135, .28)' },
  { id: 'pants-tutu', name: 'Twirl Tutu', category: 'pants', icon: '🩰', description: 'A little extra bounce', price: 17, tint: 'rgba(231, 145, 186, .28)' },
  { id: 'pants-joggers', name: 'Cloud Joggers', category: 'pants', icon: '☁️', description: 'Lounging level: expert', price: 14, tint: 'rgba(172, 181, 207, .28)' },
  { id: 'pants-rainbow', name: 'Rainbow Pants', category: 'pants', icon: '🌈', description: 'Every color, all at once', price: 20, tint: 'rgba(198, 138, 225, .3)' },

  { id: 'accessory-bandana', name: 'Adventure Bandana', category: 'accessories', icon: '🧣', description: 'A trusty trail companion', price: 9, tint: 'rgba(239, 117, 112, .28)' },
  { id: 'accessory-glasses', name: 'Round Specs', category: 'accessories', icon: '🤓', description: 'For very important sniffing', price: 13, tint: 'rgba(130, 176, 213, .28)' },
  { id: 'accessory-backpack', name: 'Mini Backpack', category: 'accessories', icon: '🎒', description: 'Snacks fit right inside', price: 17, tint: 'rgba(225, 148, 105, .28)' },
  { id: 'accessory-bell', name: 'Jingle Bell', category: 'accessories', icon: '🔔', description: 'A happy little jingle', price: 8, tint: 'rgba(244, 202, 97, .3)' },
  { id: 'accessory-cape', name: 'Super Pup Cape', category: 'accessories', icon: '🦸', description: 'For everyday heroics', price: 22, tint: 'rgba(112, 145, 224, .3)' },
  { id: 'accessory-flower', name: 'Daisy Collar', category: 'accessories', icon: '🌸', description: 'A fresh-picked favorite', price: 12, tint: 'rgba(231, 142, 177, .28)' },
  { id: 'accessory-scarf', name: 'Starry Scarf', category: 'accessories', icon: '🧣', description: 'Warm neck, cool look', price: 16, tint: 'rgba(158, 142, 227, .3)' },
  { id: 'accessory-wand', name: 'Wishbone Wand', category: 'accessories', icon: '🪄', description: 'Make a little magic', price: 19, tint: 'rgba(180, 141, 235, .3)' }
];

let activeCategory = 'all';
let searchTerm = '';
let toastTimer;
const state = loadState();
const profile = getProfile(state);

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (saved && saved.players && typeof saved.players === 'object') return saved;
  } catch (error) {
    console.warn('Could not read the arcade save; starting a fresh pet wardrobe.', error);
  }
  return { players: {}, p1: 'Player1', p2: 'Player2', mode: 'solo' };
}

function getProfile(save) {
  const playerName = typeof save.p1 === 'string' && save.p1 ? save.p1 : 'Player1';
  save.p1 = playerName;
  if (!save.players[playerName] || typeof save.players[playerName] !== 'object') {
    save.players[playerName] = {
      scores: { catch: 0, target: 0, runner: 0, smash: 0 },
      coins: 0,
      pet: { name: 'Ruem', hunger: 80, joy: 80, last: Date.now() }
    };
  }
  const player = save.players[playerName];
  if (!Number.isFinite(player.coins)) player.coins = 0;
  if (!player.pet || typeof player.pet !== 'object') player.pet = { name: 'Ruem', hunger: 80, joy: 80, last: Date.now() };
  if (!player.pet.name) player.pet.name = 'Ruem';
  if (!player.pet.wardrobe || typeof player.pet.wardrobe !== 'object') player.pet.wardrobe = {};
  const wardrobe = player.pet.wardrobe;
  if (!Array.isArray(wardrobe.owned)) wardrobe.owned = [];
  if (!wardrobe.owned.includes('shirt-classic')) wardrobe.owned.push('shirt-classic');
  if (!wardrobe.equipped || typeof wardrobe.equipped !== 'object') wardrobe.equipped = {};
  if (!wardrobe.equipped.shirts) wardrobe.equipped.shirts = 'shirt-classic';
  persist();
  return player;
}

function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (error) {
    showToast('Could not save your closet. Check browser storage settings.');
    console.error('Could not save the pet wardrobe.', error);
  }
}

function renderCategories() {
  const tabs = document.getElementById('category-tabs');
  tabs.innerHTML = CATEGORIES.map(category =>
    `<button class="category-tab${category.id === activeCategory ? ' active' : ''}" type="button" data-category="${category.id}" aria-pressed="${category.id === activeCategory}">${category.label}</button>`
  ).join('');
}

function renderCatalog() {
  const filtered = ITEMS.filter(item => {
    const categoryMatches = activeCategory === 'all' || item.category === activeCategory;
    const searchMatches = `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(searchTerm);
    return categoryMatches && searchMatches;
  });
  const grid = document.getElementById('item-grid');
  grid.innerHTML = filtered.map(item => renderCard(item)).join('');
  document.getElementById('results-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'piece' : 'pieces'}`;
  document.getElementById('empty-state').hidden = filtered.length !== 0;
}

function renderCard(item) {
  const wardrobe = profile.pet.wardrobe;
  const owned = wardrobe.owned.includes(item.id);
  const equipped = wardrobe.equipped[item.category] === item.id;
  const action = equipped ? 'Equipped' : owned ? 'Wear it' : item.price === 0 ? 'Collect' : 'Get item';
  const actionClass = equipped ? 'equipped' : owned ? 'owned' : '';
  return `<article class="item-card">
    <div class="item-art" style="--item-tint:${item.tint}">
      <span class="item-tag">${item.category}</span>
      <span class="item-icon" aria-hidden="true">${item.icon}</span>
    </div>
    <div class="item-info"><h3 class="item-name">${item.name}</h3><p class="item-description">${item.description}</p></div>
    <div class="item-footer"><span class="price">${owned ? 'OWNED' : item.price === 0 ? 'FREE' : `🪙 ${item.price}`}</span>
      <button class="item-action ${actionClass}" type="button" data-item="${item.id}" ${equipped ? 'disabled' : ''}>${action}</button>
    </div>
  </article>`;
}

function renderPreview() {
  const wardrobe = profile.pet.wardrobe;
  document.getElementById('pet-name').textContent = profile.pet.name;
  document.getElementById('coin-count').textContent = Math.floor(profile.coins);
  const equippedItems = Object.entries(wardrobe.equipped)
    .map(([category, id]) => ITEMS.find(item => item.id === id && item.category === category))
    .filter(Boolean);
  document.getElementById('pet-model').innerHTML = window.RuemPetModel.render(wardrobe.equipped, profile.pet.joy);
  document.getElementById('equipped-count').textContent = `${equippedItems.length} ${equippedItems.length === 1 ? 'item' : 'items'}`;
  document.getElementById('equipped-list').innerHTML = equippedItems.length
    ? equippedItems.map(item => `<span class="equipped-chip"><span aria-hidden="true">${item.icon}</span>${item.name}</span>`).join('')
    : '<span class="no-items">No pieces equipped yet.</span>';
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2300);
}

document.getElementById('category-tabs').addEventListener('click', event => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  activeCategory = button.dataset.category;
  renderCategories();
  renderCatalog();
});

document.getElementById('search-input').addEventListener('input', event => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderCatalog();
});

document.getElementById('item-grid').addEventListener('click', event => {
  const button = event.target.closest('[data-item]');
  if (!button) return;
  const item = ITEMS.find(candidate => candidate.id === button.dataset.item);
  if (!item) return;
  const wardrobe = profile.pet.wardrobe;
  const owned = wardrobe.owned.includes(item.id);
  if (!owned) {
    if (profile.coins < item.price) {
      showToast(`You need ${item.price - Math.floor(profile.coins)} more coins for this look.`);
      return;
    }
    profile.coins -= item.price;
    wardrobe.owned.push(item.id);
  }
  wardrobe.equipped[item.category] = item.id;
  persist();
  renderPreview();
  renderCatalog();
  showToast(`${item.name} ${owned ? 'equipped' : 'added to your closet'}!`);
});

document.getElementById('close-button').addEventListener('click', () => {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'arcade:quit' }, '*');
  } else {
    window.location.href = '../index.html';
  }
});

renderCategories();
renderPreview();
renderCatalog();
