// script.js
const deckContainer = document.getElementById('deck-container');
const btnOpen = document.getElementById('btn-open');
const summaryScreen = document.getElementById('summary-screen');
const setPicker = document.getElementById('set-picker');

let packValue = 0;
let cardsLeft = 0;
let packHistory = [];

// Tỷ lệ chuẩn (RNG)
const RATES = { 'ACE SPEC Rare': 0.05, 'Ultra Rare': 0.07, 'Illustration Rare': 0.08, 'Double Rare': 0.17 };

async function fetchCard(setId, rarity) {
    const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId} rarity:"${rarity}"&pageSize=30`);
    const data = await res.json();
    return data.data[Math.floor(Math.random() * data.data.length)];
}

async function startPack() {
    btnOpen.innerText = "LOADING...";
    btnOpen.disabled = true;
    deckContainer.innerHTML = '';
    packHistory = [];
    packValue = 0;
    cardsLeft = 10;

    const setId = setPicker.value;
    const promises = [];

    // Lấy 9 lá thường + 1 lá hiếm song song (Parallel Fetching)
    for(let i=0; i<9; i++) promises.push(fetchCard(setId, Math.random() > 0.4 ? 'Common' : 'Uncommon'));
    
    let roll = Math.random();
    let r = 'Rare';
    if (roll < RATES['ACE SPEC Rare']) r = 'ACE SPEC Rare';
    else if (roll < RATES['Ultra Rare']) r = 'Ultra Rare';
    
    promises.push(fetchCard(setId, r));

    const cards = await Promise.all(promises);

    cards.forEach((card, i) => {
        if (!card) return;
        const price = card.tcgplayer?.prices?.holofoil?.market || 0.15;
        packValue += price;
        packHistory.push({ name: card.name, price, rarity: card.rarity });
        renderCard(card, i);
    });

    btnOpen.innerText = "MỞ PACK (QUICK)";
    btnOpen.disabled = false;
}

function renderCard(card, index) {
    const el = document.createElement('div');
    el.className = `tcg-card ${card.rarity.includes('Rare') ? 'glow-rare' : ''}`;
    el.style.zIndex = index;
    el.innerHTML = `<div class="card-face"><img src="${card.images.large}" class="w-full h-full object-cover"></div>`;
    
    addDrag(el, card.rarity);
    deckContainer.appendChild(el);
}

function addDrag(el, rarity) {
    let sX, sY, x=0, y=0;

    const move = (e) => {
        const p = e.touches ? e.touches[0] : e;
        x = p.clientX - sX; y = p.clientY - sY;
        el.style.transform = `translate(${x}px, ${y}px) rotate(${x/20}deg)`;
    };

    const end = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', end);
        document.removeEventListener('touchmove', move);
        document.removeEventListener('touchend', end);

        if (Math.abs(x) > 100 || Math.abs(y) > 100) {
            const angle = Math.atan2(y, x);
            // Tốc độ bay cực nhanh: 0.2s
            el.style.transition = 'transform 0.2s ease-in';
            el.style.transform = `translate(${Math.cos(angle)*1000}px, ${Math.sin(angle)*1000}px)`;
            
            setTimeout(() => {
                el.remove();
                cardsLeft--;
                if(cardsLeft === 0) showSummary();
            }, 150); // Xóa thẻ sau 150ms
        } else {
            el.style.transition = 'transform 0.2s';
            el.style.transform = 'translate(0,0)';
        }
    };

    el.addEventListener('mousedown', (e) => {
        sX = e.clientX; sY = e.clientY;
        el.style.transition = 'none';
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', end);
    });
    
    el.addEventListener('touchstart', (e) => {
        sX = e.touches[0].clientX; sY = e.touches[0].clientY;
        el.style.transition = 'none';
        document.addEventListener('touchmove', move);
        document.addEventListener('touchend', end);
    });
}

function showSummary() {
    document.getElementById('total-price-text').innerText = `$${packValue.toFixed(2)}`;
    const list = document.getElementById('history-list');
    list.innerHTML = packHistory.map(c => `
        <div class="history-item"><span>${c.name}</span><b>$${c.price.toFixed(2)}</b></div>
    `).join('');
    summaryScreen.style.display = 'flex';
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.5 } });
}

function resetApp() {
    summaryScreen.style.display = 'none';
}

btnOpen.addEventListener('click', startPack);
