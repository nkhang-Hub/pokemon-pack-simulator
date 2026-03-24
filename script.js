const btnOpen = document.getElementById('btn-open-pack');
const packVisual = document.getElementById('pack-visual');
const startScreen = document.getElementById('start-screen');
const cardTable = document.getElementById('card-table');
const summaryOverlay = document.getElementById('summary-overlay');
const totalValText = document.getElementById('total-val');

let cardsOpened = 0;
let totalPackPrice = 0;

const SETS = {
    'sv6': 'Twilight Masquerade',
    'sv5': 'Temporal Forces',
    'sv1': 'Scarlet & Violet'
};

const DROP_RATES = { 'ACE SPEC Rare': 0.05, 'Ultra Rare': 0.07, 'Illustration Rare': 0.08, 'Double Rare': 0.17 };

async function fetchCard(setId, rarity) {
    const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId} rarity:"${rarity}"&pageSize=30`);
    const data = await res.json();
    return data.data[Math.floor(Math.random() * data.data.length)];
}

async function openPackProcess() {
    const setId = document.getElementById('set-select').value;
    
    // 1. Hiệu ứng xé bao
    packVisual.classList.add('shaking');
    btnOpen.innerText = "ĐANG XÉ...";
    
    // 2. Lấy dữ liệu 10 lá (Song song)
    const promises = [];
    for(let i=0; i<9; i++) promises.push(fetchCard(setId, Math.random() > 0.4 ? 'Common' : 'Uncommon'));
    
    let roll = Math.random();
    let r = 'Rare';
    if (roll < DROP_RATES['ACE SPEC Rare']) r = 'ACE SPEC Rare';
    else if (roll < DROP_RATES['Ultra Rare']) r = 'Ultra Rare';
    promises.push(fetchCard(setId, r));

    const cards = await Promise.all(promises);

    // 3. Hiển thị bàn bài
    startScreen.classList.add('hidden');
    cardTable.classList.remove('hidden');
    cardTable.innerHTML = '';
    cardsOpened = 0;
    totalPackPrice = 0;

    cards.forEach((card, index) => {
        const price = card.tcgplayer?.prices?.holofoil?.market || 0.15;
        totalPackPrice += price;
        createCardElement(card, index);
    });
}

function createCardElement(card, index) {
    const container = document.createElement('div');
    container.className = 'card-container';
    
    const isRare = card.rarity.includes('Rare');
    
    container.innerHTML = `
        <div class="card-inner">
            <div class="card-back"></div>
            <div class="card-front ${isRare ? 'rare-glow' : ''}">
                <img src="${card.images.small}" class="w-full h-full object-contain rounded-lg">
            </div>
        </div>
    `;

    container.onclick = function() {
        if (!this.classList.contains('is-flipped')) {
            this.classList.add('is-flipped');
            cardsOpened++;
            if (isRare) confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
            
            // Nếu lật hết 10 lá, hiện tổng kết sau 1s
            if (cardsOpened === 10) {
                setTimeout(showFinalSummary, 1500);
            }
        }
    };

    cardTable.appendChild(container);
}

function showFinalSummary() {
    totalValText.innerText = `$${totalPackPrice.toFixed(2)}`;
    summaryOverlay.classList.remove('hidden');
    confetti({ particleCount: 200, spread: 100 });
}

btnOpen.addEventListener('click', openPackProcess);
