const startGenderBtns = document.querySelectorAll('.start-gender-btn');
const homeScreen = document.getElementById('homeScreen');
const loadingScreen = document.getElementById('loadingScreen');
const analyzeScreen = document.getElementById('analyzeScreen');
const resultScreen = document.getElementById('resultScreen');
const answerButtons = document.querySelectorAll('.answer-btn');
const backButtons = document.querySelectorAll('.back-btn');

let userProfile = {};
let targetCategory = ""; 
let primaryFocus = "";   
let historyStack = [];
let userGender = ""; 
// 💾 [기능] 로컬 스토리지에서 기록 불러오기
function loadRecentHistory() {
  const history = JSON.parse(localStorage.getItem('seouria_history') || '[]');
  const section = document.getElementById('recentHistorySection');
  const list = document.getElementById('historyList');
  
  if (history.length > 0) {
    section.classList.remove('hidden');
    list.innerHTML = history.map((item, idx) => `
      <div class="history-item" onclick="viewPastResult(${idx})">
        <div class="history-info">
          <span class="history-cat">${item.gender}'s ${item.category}</span>
          <span class="history-date">${item.date}</span>
        </div>
        <div class="history-go">➔</div>
      </div>
    `).join('');
  }
}

// 💾 [기능] 과거 결과 바로보기 (제품 렌더링 엔진 포함)
window.viewPastResult = function(index) {
  const history = JSON.parse(localStorage.getItem('seouria_history') || '[]');
  const data = history[index];
  
  // 1. 유저 상태 복구
  userGender = data.gender;
  targetCategory = data.category;
  primaryFocus = data.focus;
  userProfile = data.profile;
  
  // 2. 화면 이동 (로딩 화면 띄우기)
  document.getElementById('homeScreen').classList.add('hidden');
  document.getElementById('analyzeScreen').classList.remove('hidden');
  
  // 3. DB에서 저장됐던 루틴 꺼내오기
  let routine;
  try {
    routine = (userGender === "Men") ? crossSellDB_Men[targetCategory][primaryFocus] : crossSellDB[targetCategory][primaryFocus];
  } catch (e) {
    routine = (userGender === "Men") ? crossSellDB_Men["Cream"]["Dryness"] : crossSellDB["Cream"]["Dryness"];
  }

  // 4. 가격 할인 UI 텍스트 생성기
  function getDiscountHTML(priceStr) {
    return `
      <div class="price-wrapper">
        <span class="discount-badge">Up to 25% OFF</span>
        <span class="discount-price" style="color: var(--hims-text); font-size: 15px;">Est. ${priceStr}</span>
      </div>
    `;
  }

  // 5. 메인 제품 3개 화면에 그리기
  const mainGrid = document.getElementById('mainProductsGrid');
  mainGrid.innerHTML = '';
  routine.mains.forEach(mainItem => {
    const finalLink = getSearchLink(mainItem.vendor, mainItem.name);
    mainGrid.innerHTML += `
      <div class="product-item">
        <div class="product-header">
          <img src="${mainItem.img}" class="product-img">
          <div class="product-info">
            <div class="product-step-badge" style="background-color: ${userGender === 'Men' ? '#4A5D4E' : 'var(--hims-accent)'};">${mainItem.badge}</div>
            <div class="product-name">${mainItem.name}</div>
            ${getDiscountHTML(mainItem.price)}
          </div>
        </div>
        <div class="match-reason">
          <strong style="color:var(--hims-accent); display:block; margin-bottom:5px; font-size:12px;">✨ AI 맞춤 정밀 리포트 (Saved)</strong>
          <span style="color:#555; font-size:11px; line-height:1.5;">고객님의 이전 진단 데이터를 바탕으로 다시 불러온 최적의 맞춤 솔루션입니다.<br><br><span style="color:var(--hims-text); font-weight:600;">🎯 매칭 포인트:</span> ${mainItem.matchReason}</span>
        </div>
        <a href="${finalLink}" target="_blank" class="kbeauty-link-btn">GET IT NOW ➔</a>
    `;
  });

  // 6. 시너지 부스터 제품 화면에 그리기
  const synLink = getSearchLink(routine.synergy.vendor, routine.synergy.name);
  document.getElementById('synergyProductShowcase').innerHTML = `
    <div class="product-item">
      <div class="product-header">
        <img src="${routine.synergy.img}" class="product-img">
        <div class="product-info">
          <div class="product-step-badge" style="color:#1D1D1B; border-color:#1D1D1B; background: transparent;">${routine.synergy.badge}</div>
          <div class="product-name">${routine.synergy.name}</div>
          ${getDiscountHTML(routine.synergy.price)}
        </div>
      </div>
      <div class="match-reason" style="border-top:none; padding-top:0;">
        <strong style="color:#1D1D1B; display:block; margin-bottom:5px; font-size:12px;">💡 Expert Tip: 200% 부스팅 전략</strong>
        <span style="color:#555; font-size:11px; line-height:1.5;">선택하신 제품과 완벽한 호흡을 자랑하는 시너지 조합입니다.<br><br><span style="color:var(--hims-text); font-weight:600;">🚀 시너지 효과:</span> ${routine.synergy.matchReason}</span>
      </div>
      <a href="${synLink}" target="_blank" class="kbeauty-link-btn">ADD TO ROUTINE ➔</a>
    </div>
  `;

  // 7. 대안 제품 화면에 그리기
  const answerString = Object.values(userProfile).join("");
  const userSeed = getSeed(answerString);
  const shuffledAlternatives = shuffleArraySeeded(routine.alternatives, userSeed);
  const itemsToShow = (targetCategory === "Makeup") ? shuffledAlternatives.slice(0, 4) : shuffledAlternatives.slice(0, 2); 
  const altShowcase = document.getElementById('altProductShowcase');
  altShowcase.innerHTML = ''; 
  itemsToShow.forEach(alt => {
    const finalAltLink = getSearchLink(alt.vendor, alt.name);
    altShowcase.innerHTML += `
      <div class="product-item">
        <div class="product-header">
          <img src="${alt.img}" class="product-img">
          <div class="product-info">
            <div class="product-name">${alt.name}</div>
            <div class="product-price">${alt.price}</div>
            <a href="${finalAltLink}" target="_blank" class="kbeauty-link-btn">Shop on ${alt.vendor} ➔</a>
          </div>
        </div>
      </div>
    `;
  });

  // 8. 1.2초(과거 기록은 빠르게!) 뒤에 결과창 띄우기
  setTimeout(() => {
    document.getElementById('analyzeScreen').classList.add('hidden');
    document.getElementById('resultScreen').classList.remove('hidden');
  }, 1200); 
};

// 페이지 시작 시 실행
loadRecentHistory();
// ============================================================================
// 🌸 [데이터베이스 1] 여성용 메가 DB (총 300+ 스케일 증축 완료)
// 신규 카테고리(Toner, Mask) 및 미백(Brightening) 라인업 전면 추가
// ============================================================================
const crossSellDB = {
  "Cleanser": {
    "Acne": { 
      mains: [ 
        { badge: "1st Choice", name: "COSRX Salicylic Acid Cleanser", price: "$14.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "피지와 블랙헤드를 녹이는 BHA 최적화 폼입니다." }, 
        { badge: "Great Alt", name: "Ma:nyo Pure Cleansing Oil", price: "$29.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global", matchReason: "블랙헤드와 화이트헤드를 자극 없이 녹여내는 1위 오일입니다." }, 
        { badge: "Sensitive Safe", name: "Some By Mi Miracle Cleansing Bar", price: "$15.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "YesStyle", matchReason: "순한 비누 제형을 선호하는 분들을 위한 약산성 바입니다." } 
      ], 
      synergy: { badge: "Synergy Toner", name: "Anua Heartleaf 77% Soothing Toner", price: "$18.50", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "세안 직후 어성초 토너를 발라 모공의 열감을 닫아주세요." }, 
      alternatives: [ 
        { name: "CeraVe Renewing SA Cleanser", price: "$12.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Innisfree Bija Trouble Facial Foam", price: "$11.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Soko Glam" }, 
        { name: "B.LAB Matcha Hydrating Foam", price: "$13.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "StyleKorean" },
        { name: "Round Lab Pine Tree Cica Cleanser", price: "$18.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "Senka Perfect Whip Acne Care", price: "$9.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "YesStyle" },
        { name: "Heimish All Clean Green Foam", price: "$12.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }
      ] 
    },
    "Dryness": { 
      mains: [ 
        { badge: "1st Choice", name: "Round Lab Birch Juice Cleanser", price: "$19.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "수분크림을 바른 듯 매끄러운 자작나무 수액 베이스입니다." }, 
        { badge: "Great Alt", name: "LANEIGE Water Bank Blue Gel Cleanser", price: "$24.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora", matchReason: "세안 후 당김을 최소화한 수분 보존형 약산성 젤 클렌저입니다." }, 
        { badge: "Sensitive Safe", name: "Make P:rem Safe me Relief Moisture Cleansing Foam", price: "$16.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "피부 장벽을 훼손하지 않고 노폐물만 순하게 씻어냅니다." } 
      ], 
      synergy: { badge: "Synergy Serum", name: "Torriden Dive-In Hyaluronic Serum", price: "$22.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global", matchReason: "물기가 날아가기 전에 5중 히알루론산 세럼을 펌핑해 속보습을 채우세요." }, 
      alternatives: [ 
        { name: "Isntree Hyaluronic Acid Low-pH Foam", price: "$16.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Skin1004 Centella Ampoule Foam", price: "$14.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Stylevana" },
        { name: "Etude SoonJung pH 6.5 Whip Cleanser", price: "$15.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" },
        { name: "Rovectin Aqua Cleansing Conditioning", price: "$18.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "StyleKorean" },
        { name: "KraveBeauty Matcha Hemp Cleanser", price: "$16.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Soko Glam" },
        { name: "Real Barrier Cream Cleansing Foam", price: "$17.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "YesStyle" }
      ] 
    },
    "Redness": { 
      mains: [ 
        { badge: "1st Choice", name: "Beauty of Joseon Cleansing Balm", price: "$19.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "손 마찰로 인한 붉어짐을 원천 차단하는 샤베트 밤 텍스처입니다." }, 
        { badge: "Great Alt", name: "Banila Co Clean It Zero Purifying", price: "$22.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon", matchReason: "민감성 피부를 위해 7가지 진정 허브 성분을 담은 밤입니다." }, 
        { badge: "Sensitive Safe", name: "Rovectin Skin Essentials Cleanser", price: "$17.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "StyleKorean", matchReason: "피부과 시술 직후 붉어진 피부에도 사용하는 초저자극 폼입니다." } 
      ], 
      synergy: { badge: "Synergy Pad", name: "Abib Heartleaf Spot Pad", price: "$22.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Olive Young Global", matchReason: "달아오른 양 볼에 어성초 패드를 3분만 올려두어 열감을 빼주세요." }, 
      alternatives: [ 
        { name: "Heimish All Clean Balm", price: "$18.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Dr.G pH Cleansing Gel Foam", price: "$19.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "Purito Defence Barrier Ph Cleanser", price: "$14.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Stylevana" },
        { name: "COSRX Pure Fit Cica Cleanser", price: "$15.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" },
        { name: "Be Plain Greenful pH-Balanced Cleansing Foam", price: "$16.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "YesStyle" },
        { name: "I'm From Mugwort Gel Cleanser", price: "$20.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Soko Glam" }
      ] 
    },
    "Brightening": { 
      mains: [ 
        { badge: "1st Choice", name: "The Face Shop Rice Water Bright Foaming Cleanser", price: "$12.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "쌀뜨물 세안 효과로 즉각적으로 안색을 뽀얗고 맑게 밝혀줍니다." }, 
        { badge: "Great Alt", name: "Goodal Green Tangerine Vita C Cleansing Foam", price: "$16.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global", matchReason: "청귤 추출물이 각질과 칙칙함을 씻어내어 투명한 피부를 만듭니다." }, 
        { badge: "Sensitive Safe", name: "Skinfood Rice Daily Brightening Scrub Foam", price: "$14.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "YesStyle", matchReason: "미세한 쌀겨 가루가 거친 피부 결을 스크럽하여 브라이트닝을 돕습니다." } 
      ], 
      synergy: { badge: "Synergy Toner", name: "Numbuzin No.3 Super Glowing Essence Toner", price: "$22.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "세안 직후 발효 에센스 토너를 바르면 칙칙했던 안색에 형광등이 켜집니다." }, 
      alternatives: [ 
        { name: "Neogen Real Fresh Foam Green Tea", price: "$19.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Hada Labo Shirojyun Premium Face Wash", price: "$14.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "YesStyle" },
        { name: "I'm From Rice Wash Off Mask", price: "$28.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Soko Glam" },
        { name: "Hanskin Vitamin C Pore Cleansing Oil", price: "$26.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" },
        { name: "Laneige Radian-C Cleanser", price: "$25.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" },
        { name: "Innisfree Cherry Blossom Jam Cleanser", price: "$13.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Stylevana" }
      ] 
    },
    "Aging": { 
      mains: [ 
        { badge: "1st Choice", name: "Sulwhasoo Gentle Cleansing Foam", price: "$38.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora", matchReason: "얇고 노화된 피부 장벽을 보호하며 한방 영양수를 씻어내듯 부드럽습니다." }, 
        { badge: "Great Alt", name: "d'Alba Peptide No-Sebum Gel Cleanser", price: "$28.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "StyleKorean", matchReason: "트러플과 펩타이드를 공급해 세안 단계부터 탄력을 잃지 않게 합니다." }, 
        { badge: "Premium Choice", name: "Donginbi Red Ginseng Micro Foam", price: "$32.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "딱딱해진 묵은 각질을 홍삼 진액으로 불려 부드럽게 케어합니다." } 
      ], 
      synergy: { badge: "Synergy Serum", name: "Sulwhasoo First Care Activating Serum", price: "$89.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Sephora", matchReason: "세안 직후 부스팅 에센스를 먼저 발라 피부 근본의 자생력을 깨우세요." }, 
      alternatives: [ 
        { name: "The History of Whoo Gentle Cleanser", price: "$42.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Sephora" }, 
        { name: "Beauty of Joseon Ginseng Cleansing Oil", price: "$22.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "YesStyle" },
        { name: "Missha Super Aqua Cell Renew Snail Cleansing Foam", price: "$15.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" },
        { name: "O HUI The First Geniture Foam", price: "$45.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon" },
        { name: "Su:m37 Skin Saver Essential Cleansing Foam", price: "$35.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "YesStyle" },
        { name: "IOPE Live Lift Cleansing Foam", price: "$28.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" }
      ] 
    }
  },
  "Toner": { 
    "Acne": { 
      mains: [ 
        { badge: "1st Choice", name: "Anua Heartleaf 77% Soothing Toner", price: "$18.50", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "피지 분비를 조절하고 트러블을 빠르게 진정시키는 글로벌 1위 토너입니다." }, 
        { badge: "Great Alt", name: "Some By Mi AHA BHA PHA 30 Days Miracle Toner", price: "$16.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "묵은 각질과 블랙헤드를 자극 없이 부드럽게 닦아내는 필링 토너입니다." }, 
        { badge: "Pad Choice", name: "Mediheal Teatree Trouble Pad", price: "$22.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Olive Young Global", matchReason: "화농성 여드름 위에 스킨팩처럼 올려두기 완벽한 티트리 패드입니다." } 
      ], 
      synergy: { badge: "Synergy Serum", name: "Axis-Y Dark Spot Correcting Glow Serum", price: "$18.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Stylevana", matchReason: "토너로 각질 정돈 후 색소침착 세럼을 바르면 흉터가 옅어집니다." }, 
      alternatives: [ 
        { name: "COSRX AHA/BHA Clarifying Treatment Toner", price: "$17.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Isntree Green Tea Fresh Toner", price: "$19.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "YesStyle" },
        { name: "Benton Aloe BHA Skin Toner", price: "$19.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Soko Glam" },
        { name: "Dr.G R.E.D Blemish Clear Soothing Toner", price: "$24.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "Needly Daily Toner Pad", price: "$25.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" },
        { name: "Round Lab Pine Tree Soothing Cica Pad", price: "$26.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global" }
      ] 
    },
    "Dryness": { 
      mains: [ 
        { badge: "1st Choice", name: "Round Lab 1025 Dokdo Toner", price: "$17.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Olive Young Global", matchReason: "울릉도 해양심층수 미네랄이 속건조를 즉각 해결하는 각질 정돈 토너입니다." }, 
        { badge: "Great Alt", name: "Laneige Cream Skin Refiner", price: "$33.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora", matchReason: "크림을 스킨에 그대로 녹여내어 극건성 피부에 최고의 보습력을 자랑합니다." }, 
        { badge: "Pad Choice", name: "Torriden Dive-In Multi Pad", price: "$24.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "5중 히알루론산을 머금은 밀착 패드로 화장 전 수분팩으로 쓰기 좋습니다." } 
      ], 
      synergy: { badge: "Synergy Cream", name: "Illiyoon Ceramide Ato Concentrate Cream", price: "$24.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "토너로 수분을 채운 직후 세라마이드 크림을 덮어 수분 증발을 완벽히 차단하세요." }, 
      alternatives: [ 
        { name: "Isntree Hyaluronic Acid Toner Plus", price: "$20.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Pyunkang Yul Essence Toner", price: "$19.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "YesStyle" },
        { name: "I'm From Rice Toner", price: "$28.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Soko Glam" },
        { name: "TIRTIR Milk Skin Toner", price: "$26.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" },
        { name: "COSRX Propolis Synergy Toner", price: "$22.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "SKIN1004 Hyalu-Cica Brightening Toner", price: "$18.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Stylevana" }
      ] 
    },
    "Redness": { 
      mains: [ 
        { badge: "1st Choice", name: "Etude SoonJung pH 5.5 Relief Toner", price: "$18.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "알코올과 인공향료를 완전히 배제한 97% 자연유래 성분의 극진정 토너입니다." }, 
        { badge: "Great Alt", name: "Bring Green Artemisia Calming Water Cream Toner", price: "$20.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global", matchReason: "사철쑥 추출물이 홍조와 화끈거리는 열감을 시원하게 식혀줍니다." }, 
        { badge: "Pad Choice", name: "Skinfood Carrot Carotene Calming Water Pad", price: "$26.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "도톰한 순면 솜이 민감한 피부 마찰을 줄이고 당근씨 오일로 붉은기를 다독입니다." } 
      ], 
      synergy: { badge: "Synergy Serum", name: "Skin1004 Madagascar Centella Ampoule", price: "$16.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "진정 토너 다음 단계에 병풀 100% 앰플을 올려 예민해진 피부 장벽을 빠르게 복구하세요." }, 
      alternatives: [ 
        { name: "Purito Centella Unscented Toner", price: "$19.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Make P:rem Safe me Relief Essence Toner", price: "$22.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "YesStyle" },
        { name: "Abib Heartleaf Calming Toner", price: "$24.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "COSRX Centella Water Alcohol-Free Toner", price: "$17.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" },
        { name: "Be Plain Cicaful Calming Pad", price: "$22.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "StyleKorean" },
        { name: "Goodal Houttuynia Cordata Calming Toner", price: "$20.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Stylevana" }
      ] 
    },
    "Brightening": { 
      mains: [ 
        { badge: "1st Choice", name: "Numbuzin No.3 Super Glowing Essence Toner", price: "$22.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "50가지 발효 성분이 칙칙한 안색을 맑고 투명하게 부스팅해줍니다." }, 
        { badge: "Great Alt", name: "I'm From Rice Toner", price: "$28.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Soko Glam", matchReason: "여주 쌀 추출물 77.78%가 함유되어 피부 미백과 윤광을 동시에 선사합니다." }, 
        { badge: "Pad Choice", name: "Goodal Green Tangerine Vita C Toner Pad", price: "$24.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Olive Young Global", matchReason: "아침 세안 대용으로 닦아주면 비타민C 성분이 즉각적인 브라이트닝 효과를 줍니다." } 
      ], 
      synergy: { badge: "Synergy Serum", name: "Goodal Green Tangerine Vita C Dark Spot Serum", price: "$28.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global", matchReason: "토너 패드로 각질을 연화시킨 후 비타민 세럼을 발라 기미 잡티를 확실히 타격하세요." }, 
      alternatives: [ 
        { name: "Missha Time Revolution Clear Toner", price: "$28.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Beauty of Joseon Ginseng Essence Water", price: "$18.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "YesStyle" },
        { name: "Acwell Licorice pH Balancing Cleansing Toner", price: "$18.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Soko Glam" },
        { name: "Neogen Bio-Peel Gauze Peeling Lemon", price: "$27.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Sephora" },
        { name: "Some By Mi Galactomyces Pure Vitamin C Glow Toner", price: "$22.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Stylevana" },
        { name: "Isntree Chestnut AHA 8% Clear Essence", price: "$16.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }
      ] 
    },
    "Aging": { 
      mains: [ 
        { badge: "1st Choice", name: "Sulwhasoo Essential Comfort Balancing Water", price: "$68.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora", matchReason: "마치 에센스처럼 콧물 제형으로 흐르며 노화된 피부에 즉각적인 유연함을 줍니다." }, 
        { badge: "Great Alt", name: "Missha Time Revolution The First Essence 5x", price: "$54.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon", matchReason: "익스트림 시카 효모 발효물이 탄력 잃고 처진 피부 밀도를 쫀쫀하게 채웁니다." }, 
        { badge: "Premium Choice", name: "O HUI The First Geniture Skin Softener", price: "$75.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "스킨 단계부터 줄기세포 배양액 성분을 공급하는 백화점 하이엔드 라인입니다." } 
      ], 
      synergy: { badge: "Synergy Cream", name: "IOPE Super Vital Cream Rich", price: "$85.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon", matchReason: "영양 스킨으로 길을 열어준 뒤, 고영양 안티에이징 크림을 덧발라 주름을 리프팅하세요." }, 
      alternatives: [ 
        { name: "The History of Whoo Balancer", price: "$58.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Sephora" }, 
        { name: "Donginbi Red Ginseng Essential Softener", price: "$45.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" },
        { name: "Manyo Factory Bifida Biome Ampoule Toner", price: "$24.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "Hera Signia Water", price: "$85.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora" },
        { name: "Su:m37 Secret Essence", price: "$75.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "YesStyle" },
        { name: "d'Alba White Truffle First Aromatic Toner", price: "$32.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }
      ] 
    }
  },
  "Serum": {
    "Acne": { 
      mains: [ 
        { badge: "1st Choice", name: "Anua Peach 70% Niacinamide Serum", price: "$22.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "트러블 색소 침착과 늘어진 모공을 동시에 잡는 나이아신아마이드 처방입니다." }, 
        { badge: "Great Alt", name: "Numbuzin No.3 Skin Softening Serum", price: "$24.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "YesStyle", matchReason: "오돌토돌한 요철과 좁쌀 여드름을 갈락토미세스로 부드럽게 녹여줍니다." }, 
        { badge: "Sensitive Safe", name: "Some By Mi AHA BHA PHA Miracle Serum", price: "$19.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "티트리잎수와 각질 제거 성분이 화농성 여드름을 즉각 진정시킵니다." } 
      ], 
      synergy: { badge: "Synergy Cream", name: "Dr.G R.E.D Blemish Clear Cream", price: "$28.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global", matchReason: "세럼의 유효 성분이 날아가지 않도록, 모공을 절대 막지 않는 젤 크림으로 덮어주세요." }, 
      alternatives: [ 
        { name: "COSRX Niacinamide 15% Serum", price: "$22.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Axis-Y Dark Spot Correcting Glow Serum", price: "$18.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Stylevana" },
        { name: "Skin1004 Tea-Trica Relief Ampoule", price: "$17.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" },
        { name: "Innisfree Retinol Cica Repair Ampoule", price: "$35.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora" },
        { name: "Benton Snail Bee High Content Essence", price: "$20.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Soko Glam" },
        { name: "Be Plain Cicaterol Ampoule", price: "$24.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Olive Young Global" }
      ] 
    },
    "Dryness": { 
      mains: [ 
        { badge: "1st Choice", name: "Torriden Dive-In Hyaluronic Serum", price: "$22.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "속당김을 완벽히 타격하는 5중 저분자 히알루론산 글로벌 1위 앰플입니다." }, 
        { badge: "Great Alt", name: "COSRX Advanced Snail 96 Mucin Power Essence", price: "$21.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon", matchReason: "수분 증발을 막고 피부 조직을 회복시키는 고농축 달팽이 점액 여과물입니다." }, 
        { badge: "Sensitive Safe", name: "Mixsoon Bean Essence", price: "$32.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Soko Glam", matchReason: "콩 발효 진액이 엄청난 수분감을 채우면서 묵은 각질까지 부드럽게 정돈합니다." } 
      ], 
      synergy: { badge: "Synergy Cream", name: "Illiyoon Ceramide Ato Concentrate Cream", price: "$24.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "가벼운 히알루론산 세럼 위에는 묵직한 세라마이드 캡슐 크림을 발라 수분을 꽉 잠가주세요." }, 
      alternatives: [ 
        { name: "Laneige Water Bank Blue Hyaluronic Serum", price: "$38.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" }, 
        { name: "Rovectin Aqua Hyaluronic Essence", price: "$20.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "StyleKorean" },
        { name: "Purito Deep Sea Droplet Serum", price: "$19.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" },
        { name: "Wellage Real Hyaluronic Blue 100 Ampoule", price: "$25.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "Isntree Hyaluronic Acid Water Essence", price: "$22.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "YesStyle" },
        { name: "Vely Vely Hyaluronic Acid Ampoule", price: "$28.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }
      ] 
    },
    "Redness": { 
      mains: [ 
        { badge: "1st Choice", name: "Skin1004 Madagascar Centella Ampoule", price: "$16.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon", matchReason: "다른 성분 없이 병풀 추출물 100%만 담아 붉은 기를 즉각 가라앉힙니다." }, 
        { badge: "Great Alt", name: "Purito Centella Unscented Serum", price: "$18.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Stylevana", matchReason: "민감성 피부를 위해 인공 향료를 모두 뺀 시카+세라마이드 세럼입니다." }, 
        { badge: "Sensitive Safe", name: "iUNIK Tea Tree Relief Serum", price: "$17.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "YesStyle", matchReason: "티트리와 병풀의 조합으로 얼굴에 훅 오르는 열감을 시원하게 진정시킵니다." } 
      ], 
      synergy: { badge: "Synergy Cream", name: "Dr.Jart+ Cicapair Tiger Grass Cream", price: "$42.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora", matchReason: "홍조 세럼을 바른 후, 초록색 마데카소사이드 연고 크림으로 한 번 더 덮어 재생시키세요." }, 
      alternatives: [ 
        { name: "Dr.Jart+ Cicapair Tiger Grass Serum", price: "$46.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" }, 
        { name: "Cosrx Pure Fit Cica Serum", price: "$28.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" },
        { name: "Abib Heartleaf Essence Calming Pump", price: "$25.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "Benton Snail Bee Ultimate Serum", price: "$26.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "StyleKorean" },
        { name: "Make P:rem Safe me Relief Moisture Green Ampoule", price: "$24.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" },
        { name: "Celimax The Real Noni Energy Ampoule", price: "$26.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Olive Young Global" }
      ] 
    },
    "Brightening": { 
      mains: [ 
        { badge: "1st Choice", name: "Goodal Green Tangerine Vita C Dark Spot Serum", price: "$28.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Olive Young Global", matchReason: "청귤 추출물 70% 함유로 숨은 잡티와 기미를 옅게 만들어주는 저자극 비타민 세럼입니다." }, 
        { badge: "Great Alt", name: "numbuzin No.5 Vitamin Concentrated Serum", price: "$25.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "YesStyle", matchReason: "글루타치온과 비타민의 강력한 시너지로 칙칙한 피부톤에 형광등을 켜줍니다." }, 
        { badge: "Sensitive Safe", name: "ISOI Blemish Care Up Serum", price: "$32.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "불가리안 로즈 오일 베이스로, 초민감성 피부도 안심하고 쓰는 올리브영 1위 잡티 세럼입니다." } 
      ], 
      synergy: { badge: "Synergy SunCare", name: "Beauty of Joseon Relief Sun : Rice", price: "$18.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "StyleKorean", matchReason: "미백 세럼의 효과를 지키려면 자외선 차단이 필수입니다! 쌀 추출물 선크림으로 피부를 보호하세요." }, 
      alternatives: [ 
        { name: "Missha Vita C Plus Spot Correcting", price: "$30.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" }, 
        { name: "COSRX The Vitamin C 23 Serum", price: "$25.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Jolse" },
        { name: "Some By Mi Galactomyces Pure Vitamin C", price: "$22.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Stylevana" },
        { name: "Toun28 Galactomyces + Niacinamide Serum", price: "$24.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Soko Glam" },
        { name: "Jumiso All Day Vitamin Brightening & Balancing", price: "$22.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon" },
        { name: "Glow Recipe Watermelon Glow Niacinamide Dew Drops", price: "$34.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" }
      ] 
    },
    "Aging": { 
      mains: [ 
        { badge: "1st Choice", name: "Sulwhasoo First Care Activating Serum", price: "$89.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora", matchReason: "세안 직후 발라 피부 근본의 자생력을 깨우고 다음 스킨케어의 흡수를 돕는 1위 한방 에센스입니다." }, 
        { badge: "Great Alt", name: "Missha Time Revolution Night Repair Ampoule 5X", price: "$35.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "극강의 프로바이오틱스 발효 성분으로 밤사이 처진 탄력과 미세 주름을 팽팽하게 채워줍니다." }, 
        { badge: "Sensitive Safe", name: "Beauty of Joseon Revive Serum: Ginseng + Snail Mucin", price: "$17.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "인삼 추출물과 달팽이 점액이 피부 세포 탄력을 순하고 쫀쫀하게 복원합니다." } 
      ], 
      synergy: { badge: "Synergy Cream", name: "IOPE Super Vital Cream Rich", price: "$85.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon", matchReason: "앰플로 끌어올린 탄력이 무너지지 않게 백화점 1위 고영양 안티에이징 크림으로 코팅하세요." }, 
      alternatives: [ 
        { name: "Manyo Factory Bifida Biome Complex Ampoule", price: "$28.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "YesStyle" }, 
        { name: "O HUI The First Geniture Ampoule Advanced", price: "$120.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" },
        { name: "IOPE Retinol Expert 0.1%", price: "$65.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" },
        { name: "Hera Signia Core Lifting Serum", price: "$110.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Sephora" },
        { name: "Su:m37 Secret Essence Double Concentrate", price: "$85.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "YesStyle" },
        { name: "Dr.G Royal Black Snail Ampoule", price: "$32.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global" }
      ] 
    }
  },
  "Cream": {
    "Acne": { 
      mains: [ 
        { badge: "1st Choice", name: "Dr.G R.E.D Blemish Clear Cream", price: "$28.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "모공을 절대 막지 않는 논코메도제닉 병풀 젤 수분 크림입니다." }, 
        { badge: "Great Alt", name: "iUNIK Centella Calming Gel Cream", price: "$15.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon", matchReason: "티트리잎수 70% 함유로 유분기 없이 트러블만 빠르게 가라앉힙니다." }, 
        { badge: "Sensitive Safe", name: "Purito Oat-in Calming Gel Cream", price: "$18.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Stylevana", matchReason: "오트밀 성분이 트러블 피부 특유의 예민함을 순하게 달래줍니다." } 
      ], 
      synergy: { badge: "Synergy Mask", name: "Mediheal Teatree Care Solution Essential Mask", price: "$10.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global", matchReason: "크림을 바르기 전 티트리 마스크팩을 15분간 올려 붉은 화농성 트러블을 잠재우세요." }, 
      alternatives: [ 
        { name: "Benton Aloe Propolis Soothing Gel", price: "$16.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Isntree Green Tea Fresh Emulsion", price: "$17.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "YesStyle" },
        { name: "Illiyoon Ceramide Ato Soothing Gel", price: "$20.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon" },
        { name: "Torriden Dive-In Soothing Cream", price: "$22.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "Cosrx Oil-Free Ultra-Moisturizing Lotion", price: "$22.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" },
        { name: "Round Lab Pine Tree Cica Cream", price: "$24.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global" }
      ] 
    },
    "Dryness": { 
      mains: [ 
        { badge: "1st Choice", name: "Illiyoon Ceramide Ato Concentrate Cream", price: "$24.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "극건성 피부를 위한 고농축 세라마이드 캡슐 장벽 크림입니다." }, 
        { badge: "Great Alt", name: "COSRX Advanced Snail 92 All in one Cream", price: "$22.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "YesStyle", matchReason: "달팽이 점액질이 건조함으로 쩍쩍 갈라지는 피부를 쫀쫀하게 이어줍니다." }, 
        { badge: "Sensitive Safe", name: "AESTURA Atobarrier 365 Cream", price: "$32.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Olive Young Global", matchReason: "피부 지질 구조와 유사한 더마타민 성분으로 가장 완벽한 저자극 보습막을 씌웁니다." } 
      ], 
      synergy: { badge: "Synergy Serum", name: "Torriden Dive-In Hyaluronic Serum", price: "$22.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "크림을 두껍게 바르기 전, 히알루론산 세럼으로 피부 속 빈 공간에 물을 흠뻑 채워주세요." }, 
      alternatives: [ 
        { name: "Etude SoonJung 2x Barrier Intensive Cream", price: "$18.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Real Barrier Extreme Cream", price: "$35.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon" },
        { name: "Purito Deep Sea Pure Water Cream", price: "$19.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Stylevana" },
        { name: "Zeroid Intensive Cream", price: "$30.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" },
        { name: "Laneige Water Bank Blue Hyaluronic Cream", price: "$40.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" },
        { name: "Pyunkang Yul Nutrition Cream", price: "$28.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon" }
      ] 
    },
    "Redness": { 
      mains: [ 
        { badge: "1st Choice", name: "Dr.Jart+ Cicapair Tiger Grass Cream", price: "$42.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora", matchReason: "초록색 마데카소사이드 연고 텍스처로 심한 홍조를 덮어 빠르게 재생시킵니다." }, 
        { badge: "Great Alt", name: "Klairs Midnight Blue Calming Cream", price: "$24.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Soko Glam", matchReason: "구아이아줄렌 성분이 자외선이나 시술로 달아오른 피부 온도를 즉시 식혀줍니다." }, 
        { badge: "Sensitive Safe", name: "Make P:rem Safe me Relief Moisture Cream", price: "$28.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon", matchReason: "단 12가지 최소 성분만 처방하여 자극받은 피부를 가장 안전하게 다독입니다." } 
      ], 
      synergy: { badge: "Synergy SunCare", name: "Dr.G Green Mild Up Sun+", price: "$22.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Olive Young Global", matchReason: "홍조 크림으로 진정시킨 피부가 다시 붉어지지 않도록 100% 무기자차 선크림으로 완벽 방어하세요." }, 
      alternatives: [ 
        { name: "Pyunkang Yul Calming Moisture Barrier Cream", price: "$20.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Be Plain Cicaful Calming Gel", price: "$22.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "Benton Goodbye Redness Centella Gel", price: "$18.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "StyleKorean" },
        { name: "Skin1004 Madagascar Centella Soothing Cream", price: "$19.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon" },
        { name: "Cosrx Balancium Comfort Ceramide Cream", price: "$26.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "YesStyle" },
        { name: "Rovectin Cica Care Balm", price: "$24.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Soko Glam" }
      ] 
    },
    "Brightening": { 
      mains: [ 
        { badge: "1st Choice", name: "Goodal Green Tangerine Vita C Dark Spot Cream", price: "$24.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Olive Young Global", matchReason: "비타민C 생기 캡슐이 톡톡 터지며 칙칙한 잡티와 기미를 집중 미백합니다." }, 
        { badge: "Great Alt", name: "Laneige Radian-C Cream", price: "$35.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora", matchReason: "초미세 비타민 성분이 블루라이트와 자외선으로 인한 미세 잡티까지 제거합니다." }, 
        { badge: "Sensitive Safe", name: "I'm From Vitamin Tree Water-Gel", price: "$28.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Soko Glam", matchReason: "비타민나무수 68% 베이스의 쿨링 젤 크림으로 붉은기 없이 투명하게 밝혀줍니다." } 
      ], 
      synergy: { badge: "Synergy Serum", name: "numbuzin No.5 Vitamin Concentrated Serum", price: "$25.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "미백 크림을 바르기 전 고농축 글루타치온 세럼을 레이어링하면 형광등 효과가 두 배가 됩니다." }, 
      alternatives: [ 
        { name: "Some By Mi Yuja Niacin Brightening Moisture Gel Cream", price: "$20.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Hanyul Yuja Sleeping Mask", price: "$32.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "YesStyle" },
        { name: "Toun28 Galactomyces + Niacinamide", price: "$24.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Soko Glam" },
        { name: "Cosrx Advanced Snail Radiance Dual Essence", price: "$28.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon" },
        { name: "Sulwhasoo Snowise Brightening Cream", price: "$130.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Sephora" },
        { name: "Skinfood Tomato Whitening Cream", price: "$18.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }
      ] 
    },
    "Aging": { 
      mains: [ 
        { badge: "1st Choice", name: "IOPE Super Vital Cream Rich", price: "$85.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon", matchReason: "무너지는 턱선과 잃어버린 탄력을 쫀쫀하게 채워주는 백화점 안티에이징 1위 영양 크림입니다." }, 
        { badge: "Great Alt", name: "Missha Time Revolution Night Repair Ampoule Cream 5X", price: "$40.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Soko Glam", matchReason: "수면 시간 동안 극강의 프로바이오틱스가 주름과 미세 탄력을 집중 복원합니다." }, 
        { badge: "Premium Choice", name: "Sulwhasoo Concentrated Ginseng Renewing Cream EX", price: "$240.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora", matchReason: "인삼 결정을 50배 농축시켜 스스로 빛나는 기품 있는 피부를 만듭니다." } 
      ], 
      synergy: { badge: "Synergy EyeCare", name: "AHC Ten Revolution Real Eye Cream For Face", price: "$28.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Olive Young Global", matchReason: "얼굴 전체에 크림을 바르기 전, 깊은 주름이 생기기 쉬운 눈가와 팔자에 아이크림을 도포하세요." }, 
      alternatives: [ 
        { name: "The History of Whoo Bichup Ja Yoon Cream", price: "$180.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" }, 
        { name: "d'Alba White Truffle Double Serum & Cream", price: "$65.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" },
        { name: "Dr.G Royal Black Snail Cream", price: "$38.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "Hera Signia Cream", price: "$250.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora" },
        { name: "Donginbi Red Ginseng Power Repair Cream", price: "$110.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" },
        { name: "Su:m37 Secret Cream", price: "$120.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "YesStyle" }
      ] 
    }
  },
  "Mask": { 
    "Acne": { 
      mains: [ 
        { badge: "1st Choice", name: "Mediheal Teatree Care Solution Essential Mask EX", price: "$10.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "갑자기 올라온 화농성 여드름을 즉각적으로 가라앉히는 글로벌 1위 시트 마스크입니다." }, 
        { badge: "Great Alt", name: "I'm From Mugwort Mask", price: "$35.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Soko Glam", matchReason: "진짜 쑥 원물이 듬뿍 담긴 워시오프 팩으로 성난 피부의 열감과 독소를 쫙 빼줍니다." }, 
        { badge: "Sensitive Safe", name: "Abib Gummy Sheet Mask Heartleaf Sticker", price: "$18.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "껌딱지처럼 얼굴 곡선에 완벽하게 밀착되어 어성초 진정 앰플을 빈틈없이 흡수시킵니다." } 
      ], 
      synergy: { badge: "Synergy Cream", name: "Dr.G R.E.D Blemish Clear Cream", price: "$28.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global", matchReason: "마스크팩을 떼어낸 후 가벼운 시카 젤 크림을 발라 수분이 날아가는 것을 방어하세요." }, 
      alternatives: [ 
        { name: "Innisfree Super Volcanic Pore Clay Mask 2X", price: "$15.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" }, 
        { name: "Some By Mi Super Matcha Pore Clean Clay Mask", price: "$18.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon" },
        { name: "COSRX Acne Pimple Master Patch", price: "$6.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" },
        { name: "Dr.Jart+ Dermask Micro Jet Clearing Solution", price: "$9.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora" },
        { name: "Benton Aloe Soothing Mask Pack", price: "$12.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "StyleKorean" },
        { name: "Round Lab Pine Tree Cica Mask", price: "$14.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global" }
      ] 
    },
    "Dryness": { 
      mains: [ 
        { badge: "1st Choice", name: "Torriden Dive-In Low Molecular Hyaluronic Acid Mask", price: "$15.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "수분 앰플 한 병을 통째로 머금은 듯, 극건성 피부의 속당김을 한 방에 해결합니다." }, 
        { badge: "Great Alt", name: "I'm From Honey Mask", price: "$38.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Soko Glam", matchReason: "리얼 지리산 꿀 38.7% 함유로 각질 부각이 심한 피부에 깊은 영양과 보습막을 씌웁니다." }, 
        { badge: "Sensitive Safe", name: "Round Lab 1025 Dokdo Water Gel Mask", price: "$14.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "해양심층수 미네랄이 아주 순하고 매끄럽게 피부 수분길을 열어줍니다." } 
      ], 
      synergy: { badge: "Synergy Cream", name: "Illiyoon Ceramide Ato Concentrate Cream", price: "$24.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "수분 팩 직후 피부 겉에 세라마이드 크림을 도톰하게 발라 슬리핑 팩처럼 활용하세요." }, 
      alternatives: [ 
        { name: "Mediheal N.M.F Intensive Hydrating Mask", price: "$12.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global" }, 
        { name: "Laneige Water Sleeping Mask", price: "$32.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" },
        { name: "Dr.Jart+ Ceramidin Facial Barrier Mask", price: "$9.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Sephora" },
        { name: "Abib Mild Acidic pH Sheet Mask Aqua Fit", price: "$18.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Stylevana" },
        { name: "Cosrx Ultimate Nourishing Rice Overnight Spa Mask", price: "$18.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon" },
        { name: "Real Barrier Extreme Cream Mask", price: "$16.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "YesStyle" }
      ] 
    },
    "Redness": { 
      mains: [ 
        { badge: "1st Choice", name: "Dr.Jart+ Cicapair Tiger Grass Calming Mask", price: "$9.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora", matchReason: "초록색 호랑이풀 시럽 에센스가 붉게 달아오른 홍조 피부를 즉시 식혀줍니다." }, 
        { badge: "Great Alt", name: "Be Plain Cicaful Calming Mask", price: "$16.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "병풀 추출물 83% 함유의 pH 약산성 마스크로 얇아진 피부 장벽을 편안하게 복구합니다." }, 
        { badge: "Sensitive Safe", name: "Benton Aloe Soothing Mask Pack", price: "$12.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon", matchReason: "알로에베라와 녹차수 베이스로 햇볕에 그을렸거나 시술 직후의 열감을 차갑게 잡아냅니다." } 
      ], 
      synergy: { badge: "Synergy Serum", name: "Skin1004 Madagascar Centella Ampoule", price: "$16.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon", matchReason: "팩을 하기 전 진정 앰플을 도톰하게 깔아두고 시트지를 올리면 침투력이 극대화됩니다." }, 
      alternatives: [ 
        { name: "Mediheal Madecassoside Essential Mask", price: "$10.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global" }, 
        { name: "Purito Centella Unscented Recovery Cream", price: "$19.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon" },
        { name: "Skinfood Carotene Carotene Calming Water Pad", price: "$26.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "Make P:rem Safe me Relief Moisture Mask", price: "$15.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "YesStyle" },
        { name: "COSRX Pure Fit Cica Calming True Sheet Mask", price: "$14.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" },
        { name: "Rovectin Dr. Mask Cica", price: "$16.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "StyleKorean" }
      ] 
    },
    "Brightening": { 
      mains: [ 
        { badge: "1st Choice", name: "Goodal Green Tangerine Vita C Dark Spot Mask", price: "$15.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "올리브영 1위 비타민 세럼을 시트 한 장에 통째로 부어 만든 강력한 미백 팩입니다." }, 
        { badge: "Great Alt", name: "Mediheal Vita Essential Mask", price: "$10.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "비타민 활력 에센스가 칙칙한 안색을 즉각적으로 맑고 투명하게 톤업시킵니다." }, 
        { badge: "Sensitive Safe", name: "I'm From Fig Scrub Mask", price: "$32.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Soko Glam", matchReason: "무화과 효소가 칙칙한 각질을 부드럽게 녹여내어 스파를 받은 듯한 안색을 줍니다." } 
      ], 
      synergy: { badge: "Synergy Serum", name: "numbuzin No.5 Vitamin Concentrated Serum", price: "$25.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "YesStyle", matchReason: "미백 팩 사용 후 비타민 세럼으로 마무리하면 기미와 잡티의 멜라닌 생성을 강력 억제합니다." }, 
      alternatives: [ 
        { name: "Some By Mi Yuja Niacin 30 Days Miracle Brightening Mask", price: "$14.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Jayjun Intensive Shining Mask", price: "$22.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Stylevana" },
        { name: "Papa Recipe Bombee Honey Mask", price: "$18.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" },
        { name: "Skinfood Black Sugar Mask Wash Off", price: "$11.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon" },
        { name: "Neogen Bio-Peel Gauze Peeling Wine", price: "$27.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" },
        { name: "Dr.Jart+ Dermask Brightening Solution", price: "$9.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Sephora" }
      ] 
    },
    "Aging": { 
      mains: [ 
        { badge: "1st Choice", name: "Abib Gummy Sheet Mask Collagen Milk Sticker", price: "$18.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "비건 콜라겐 우유 에센스가 처진 피부에 쫀쫀한 영양과 탄력을 강력하게 풀충전합니다." }, 
        { badge: "Great Alt", name: "Mediheal Collagen Essential Mask", price: "$10.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "늘어진 세로 모공과 힘없는 피부를 식물성 콜라겐으로 탱탱하게 끌어올립니다." }, 
        { badge: "Premium Choice", name: "Sulwhasoo Concentrated Ginseng Renewing Creamy Mask", price: "$120.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora", matchReason: "인삼 크림 한 통을 팩 한 장에 담아, 결혼식 전날 사용하는 최고의 VVIP 스페셜 케어입니다." } 
      ], 
      synergy: { badge: "Synergy Cream", name: "IOPE Super Vital Cream Rich", price: "$85.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon", matchReason: "고영양 탄력 팩을 마친 후 안티에이징 영양 크림으로 코팅하여 콜라겐 증발을 꽉 막으세요." }, 
      alternatives: [ 
        { name: "JM Solution Marine Luminous Pearl Deep Moisture Mask", price: "$15.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Missha Time Revolution Night Repair Ampoule Mask", price: "$25.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Soko Glam" },
        { name: "The History of Whoo Bichup Royal Anti-Aging Mask", price: "$85.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Sephora" },
        { name: "d'Alba White Truffle Nourishing Treatment Mask", price: "$28.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon" },
        { name: "IOPE Bio Essence Mask", price: "$35.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" },
        { name: "Su:m37 Secret Programming Mask", price: "$75.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "YesStyle" }
      ] 
    }
  },
  "SunCare": {
    "Acne": { 
      mains: [ 
        { badge: "1st Choice", name: "Round Lab Birch Juice Moisturizing Sun Cream", price: "$19.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Olive Young Global", matchReason: "모공을 막지 않는 완벽한 수분 크림 제형의 여드름 안심 선크림입니다." }, 
        { badge: "Great Alt", name: "SKIN1004 Hyalu-Cica Water-Fit Sun Serum", price: "$16.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Stylevana", matchReason: "세럼처럼 얇게 스며들어 유분 폭발을 원천 차단하는 수분 자차입니다." }, 
        { badge: "Sensitive Safe", name: "Goodal Green Tangerine Vita C Dark Spot Sun", price: "$18.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon", matchReason: "여드름 흉터와 잡티가 짙어지지 않게 비타민 케어를 병행합니다." } 
      ], 
      synergy: { badge: "Synergy Cleanser", name: "COSRX Salicylic Acid Gentle Cleanser", price: "$14.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "선크림을 바른 날은 무조건 BHA 폼으로 모공 속에 잔여물이 남지 않게 씻어내세요." }, 
      alternatives: [ 
        { name: "Isntree Onion Newpair Sunscreen", price: "$22.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "YesStyle" }, 
        { name: "Dr.G R.E.D Blemish Soothing Up Sun", price: "$24.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" },
        { name: "Tocobo Cotton Soft Sun Stick", price: "$19.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Stylevana" },
        { name: "Benton Air Fit UV defense Sun Cream", price: "$20.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "StyleKorean" },
        { name: "Abib Heartleaf Sun Essence Calming Drop", price: "$28.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "Make P:rem UV Defense Me Daily Sun Fluid", price: "$26.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }
      ] 
    },
    "Dryness": { 
      mains: [ 
        { badge: "1st Choice", name: "Beauty of Joseon Relief Sun : Rice + Probiotics", price: "$18.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "건성 피부에 영양 크림처럼 촉촉하게 스며드는 글로벌 1위 선크림입니다." }, 
        { badge: "Great Alt", name: "d'Alba Waterfull Essence Sun Cream", price: "$26.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "화이트 트러플 에센스가 함유되어 바를수록 광채가 살아납니다." }, 
        { badge: "Sensitive Safe", name: "Isntree Hyaluronic Acid Watery Sun Gel", price: "$20.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "YesStyle", matchReason: "8중 히알루론산이 햇빛에 피부 수분이 날아가는 것을 방어합니다." } 
      ], 
      synergy: { badge: "Synergy Serum", name: "Torriden Dive-In Hyaluronic Serum", price: "$22.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Olive Young Global", matchReason: "선크림을 바르기 전, 수분 세럼을 얇게 깔아두면 오후가 되어도 화장이 뜨지 않습니다." }, 
      alternatives: [ 
        { name: "Tocobo Bio Watery Sun Cream", price: "$19.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Soko Glam" }, 
        { name: "Cosrx Aloe Soothing Sun Cream", price: "$16.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" },
        { name: "Laneige Watery Sun Cream", price: "$28.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Sephora" },
        { name: "Round Lab Birch Juice Moisturizing Sun Stick", price: "$22.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "Missha All Around Safe Block Essence Sun", price: "$14.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon" },
        { name: "Etude Sunprise Mild Airy Finish Sun Milk", price: "$15.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon" }
      ] 
    },
    "Redness": { 
      mains: [ 
        { badge: "1st Choice", name: "Dr.G Green Mild Up Sun+", price: "$22.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "피부에 흡수되지 않고 빛을 튕겨내는 100% 징크 무기자차입니다." }, 
        { badge: "Great Alt", name: "Make P:rem UV Defense Me Calming Sun", price: "$24.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon", matchReason: "눈 시림을 완벽히 잡은 순한 대용량 무기자차입니다." }, 
        { badge: "Sensitive Safe", name: "Benton Skin Fit Mineral Sun Cream", price: "$20.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Soko Glam", matchReason: "무기자차 특유의 뻣뻣함을 줄이고 로션처럼 부드럽게 개선했습니다." } 
      ], 
      synergy: { badge: "Synergy Toner", name: "Etude SoonJung 5.5 Relief Toner", price: "$18.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon", matchReason: "붉게 달아오른 피부에 무기자차를 얹기 전, 가장 순한 진정 토너로 피부 온도를 낮추세요." }, 
      alternatives: [ 
        { name: "Purito Daily Go-To Sunscreen", price: "$18.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, 
        { name: "Axis-Y Complete No-Stress Physical Sunscreen", price: "$21.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "YesStyle" },
        { name: "Skin1004 Madagascar Centella Air-Fit Suncream", price: "$19.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon" },
        { name: "Innisfree Daily UV Defense Sunscreen", price: "$16.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" },
        { name: "COSRX Shield Fit Snail Essence Sun", price: "$18.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "YesStyle" },
        { name: "Some By Mi Truecica Mineral Calming Tone-Up Suncream", price: "$20.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Stylevana" }
      ] 
    },
    "Brightening": { 
      mains: [ 
        { badge: "1st Choice", name: "d'Alba Waterfull Tone-Up Sun Cream", price: "$29.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "칙칙한 기미를 가려주는 핑크빛 톤업과 자외선 차단을 동시에 해줍니다." }, 
        { badge: "Great Alt", name: "Numbuzin No.3 Porcelain Base-skip Tone Up Beige", price: "$24.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global", matchReason: "파데프리로 유명하며 울긋불긋한 피부톤을 깨끗한 도자기 결로 만듭니다." }, 
        { badge: "Sensitive Safe", name: "Cell Fusion C Toning Sunscreen 100", price: "$28.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon", matchReason: "피부과 시술 후 잡티를 가리기 위해 처방하는 1위 더마 톤업 자차입니다." } 
      ], 
      synergy: { badge: "Synergy Serum", name: "Goodal Green Tangerine Vita C Dark Spot Serum", price: "$28.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Olive Young Global", matchReason: "자외선 차단 전 비타민C 세럼을 바르면 항산화 효과가 배가되어 기미를 이중 방어합니다." }, 
      alternatives: [ 
        { name: "Dr.G Brightening Up Sun+", price: "$24.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global" }, 
        { name: "Heimish Artless Glow Base", price: "$22.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon" },
        { name: "Rom&nd Back Me Tone Up Cream", price: "$14.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "YesStyle" },
        { name: "Espoir Water Splash Sun Cream", price: "$20.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "TIRTIR My Glow Cream Tinted Sun", price: "$25.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon" },
        { name: "Hanyul White Chrysanthemum Tone-up Sun", price: "$30.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" }
      ] 
    },
    "Aging": { 
      mains: [ 
        { badge: "1st Choice", name: "HERA UV Protector Multi Defense", price: "$40.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "광노화를 완벽 방어하는 럭셔리 스킨케어 베이스의 백화점 1위 선크림입니다." }, 
        { badge: "Great Alt", name: "Sulwhasoo UV Wise Day Cream", price: "$65.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Sephora", matchReason: "미세먼지와 외부 유해환경으로부터 노화되는 피부를 고급스럽게 보호합니다." }, 
        { badge: "Premium Choice", name: "O HUI Day Shield Perfect Sun", price: "$45.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "주름에 끼임 없이 매끄럽게 발리며 강력한 자외선 차단막을 칩니다." } 
      ], 
      synergy: { badge: "Synergy Serum", name: "Missha Time Revolution Night Repair Ampoule 5X", price: "$35.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "외출 전 완벽한 자차로 방어하고, 밤에는 안티에이징 앰플로 손상된 탄력을 복원하세요." }, 
      alternatives: [ 
        { name: "IOPE UV Shield Sun Protector", price: "$32.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, 
        { name: "AHC Natural Perfection Double Shield Sun Stick", price: "$22.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "StyleKorean" },
        { name: "The History of Whoo Gongjinhyang Sun Cream", price: "$55.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Sephora" },
        { name: "Donginbi Red Ginseng Daily Defense Sun", price: "$40.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" },
        { name: "Missha Time Revolution Artemisia Sun", price: "$28.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon" },
        { name: "Su:m37 Sun-away Multi Effect Sun Block", price: "$45.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "YesStyle" }
      ] 
    }
  },
  "Makeup": {
    "Base": { 
      mains: [ 
        { badge: "1st Choice", name: "TIRTIR Mask Fit Red Cushion", price: "$25.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon", matchReason: "글로벌 1위, 붉은기와 모공을 싹 가려주는 완벽한 풀 커버력을 자랑합니다." }, 
        { badge: "Great Alt", name: "Jung Saem Mool Essential Skin Nuder Cushion", price: "$42.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon", matchReason: "답답함 없이 원래 내 피부결이 좋은 것처럼 표현되는 맑은 윤광 쿠션입니다." }, 
        { badge: "Matte Safe", name: "LANEIGE Neo Cushion Matte", price: "$35.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora", matchReason: "머리카락이 붙지 않고 하루 종일 보송하게 밀착되는 매트의 정석입니다." } 
      ], 
      synergy: { badge: "Synergy Primer", name: "VDL Lumilayer Primer", price: "$26.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora", matchReason: "베이스 전에 얇게 깔아주면 조명을 켠 듯 은은한 입체감과 진주빛 광채가 살아납니다." }, 
      alternatives: [ 
        { name: "Hince Second Skin Foundation", price: "$36.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global" }, 
        { name: "Clio Kill Cover The New Founwear Cushion", price: "$30.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "YesStyle" },
        { name: "The Saem Cover Perfection Tip Concealer", price: "$6.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" },
        { name: "Sulwhasoo Perfecting Cushion", price: "$65.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Sephora" },
        { name: "Rom&nd Nu Zero Cushion", price: "$18.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "Amuse Dew Jelly Vegan Cushion", price: "$34.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon" }
      ] 
    },
    "Lip": { 
      mains: [ 
        { badge: "1st Choice", name: "Rom&nd Juicy Lasting Tint", price: "$12.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "YesStyle", matchReason: "시간이 지날수록 맑게 차오르는 탕후루 광택과 엄청난 유지력을 자랑합니다." }, 
        { badge: "Great Alt", name: "Laka Fruity Glam Tint", price: "$16.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global", matchReason: "물처럼 가볍게 발리며 투명한 수분 광채와 과즙 발색이 특징입니다." }, 
        { badge: "Velvet Safe", name: "Peripera Ink Mood Matte Tint", price: "$11.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "건조함 없이 부드럽게 주름을 메우며 입술에 밀착되는 블러링 틴트입니다." } 
      ], 
      synergy: { badge: "Synergy Fixing", name: "Etude Fixing Tint", price: "$14.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Soko Glam", matchReason: "글로우 틴트를 바르기 전 베이스로 픽싱 틴트를 깔아두면 식사 후에도 지워지지 않습니다." }, 
      alternatives: [ 
        { name: "3CE Velvet Lip Tint", price: "$15.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" }, 
        { name: "HERA Sensual Powder Matte Liquid", price: "$35.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "BBIA Last Velvet Lip Tint", price: "$10.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Stylevana" },
        { name: "Amuse Jel-Fit Tint", price: "$20.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon" },
        { name: "Clio Crystal Glam Tint", price: "$18.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global" },
        { name: "Muzigae Mansion Objet Liquid", price: "$22.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "YesStyle" }
      ] 
    },
    "Eye": { 
      mains: [ 
        { badge: "1st Choice", name: "Dasique Shadow Palette", price: "$34.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "버릴 색이 하나도 없는 완벽한 톤온톤 9구 데일리 팔레트입니다." }, 
        { badge: "Great Alt", name: "Clio Kill Lash Superproof Mascara", price: "$18.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon", matchReason: "하루 종일 쳐지지 않고 팬더 눈이 되지 않는 K-뷰티 최강의 마스카라입니다." }, 
        { badge: "Point Safe", name: "Too Cool For School Artclass Frottage Pencil", price: "$12.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Soko Glam", matchReason: "가루날림 없이 애교살을 3초 만에 빵빵하게 채워주는 부드러운 글리터 펜슬입니다." } 
      ], 
      synergy: { badge: "Synergy Eyeliner", name: "BBIA Last Auto Gel Eyeliner", price: "$10.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "섀도우로 음영을 준 뒤, 땀과 눈물에 강한 젤 라이너로 꼬리를 선명하게 빼주세요." }, 
      alternatives: [ 
        { name: "Wakemake Soft Blurring Eye Palette", price: "$28.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global" }, 
        { name: "3CE Multi Eye Color Palette", price: "$38.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Sephora" },
        { name: "Etude Dr. Mascara Fixer", price: "$8.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon" },
        { name: "Peripera All Take Mood Palette", price: "$20.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Stylevana" },
        { name: "Rom&nd Better Than Palette", price: "$25.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "YesStyle" },
        { name: "Kiss Me Heroine Make Smooth Liquid Eyeliner", price: "$14.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" }
      ] 
    }
  }
};

// ============================================================================
// 👨 [데이터베이스 2] 남성용 옴므 DB (스킨/로션, 톤업 라인 완벽 개통!)
// ============================================================================
const crossSellDB_Men = {
  "Cleanser": {
    "Acne": { mains: [ { badge: "1st Choice", name: "Be Ready AC Cleansing Foam", price: "$15.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Olive Young Global", matchReason: "남성의 두꺼운 피지를 강력하게 녹이는 여드름 전용 폼입니다." }, { badge: "Great Alt", name: "Senka Perfect Whip For Men", price: "$10.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon", matchReason: "숯 성분이 함유되어 모공 속 블랙헤드를 뽀득하게 뽑아냅니다." }, { badge: "Sensitive Safe", name: "Round Lab Birch Cleanser", price: "$18.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "StyleKorean", matchReason: "피지가 씻겨나간 자리에 수분을 남기는 저자극 약산성 젤 폼입니다." } ], synergy: { badge: "Synergy Toner", name: "Ideal For Men Cica Toner", price: "$20.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Musinsa Global", matchReason: "딥 클렌징 후 건조해진 모공에 시카 토너를 즉각 발라 피지 분비를 조절하세요." }, alternatives: [ { name: "UrOS Face Wash", price: "$12.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, { name: "Dr.G Homme Foam", price: "$16.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon" } ] },
    "Dryness": { mains: [ { badge: "1st Choice", name: "Laneige Homme Blue Gel Cleanser", price: "$22.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora", matchReason: "세안 직후 수건으로 닦아도 당기지 않는 수분 보존 클렌저입니다." }, { badge: "Great Alt", name: "Make P:rem Safe me Cleansing Foam", price: "$16.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "세안 후 얼굴이 찢어질 듯 당기는 분들을 위한 수분 촉촉 약산성 폼입니다." }, { badge: "Sensitive Safe", name: "Dr.Jart+ For Men Foam", price: "$24.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "건조하고 하얗게 각질이 일어나는 남성 피부용 더마 보습 폼입니다." } ], synergy: { badge: "Synergy Serum", name: "UrOS Skin Milk", price: "$29.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon", matchReason: "세안 후 귀찮게 겹쳐 바를 필요 없이, 보습감 넘치는 우르오스 밀크 하나면 끝납니다." }, alternatives: [ { name: "IOPE Men Perfect Clean", price: "$20.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, { name: "Hera Homme Foam", price: "$28.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Sephora" } ] },
    "Redness": { mains: [ { badge: "1st Choice", name: "Gillette ProGlide Clear Shaving Gel", price: "$12.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "수염이 잘 보이도록 투명하게 밀착되어 베임과 붉어짐을 방지합니다." }, { badge: "Great Alt", name: "Be Ready Cica Shaving", price: "$18.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon", matchReason: "풍성한 거품이 칼날 마찰을 줄여 면도 후 홍조를 막아줍니다." }, { badge: "Sensitive Safe", name: "Ideal For Men Mild Foam", price: "$16.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "상처 난 턱에 닿아도 화끈거리지 않고 즉각 피부를 진정시킵니다." } ], synergy: { badge: "Synergy Pad", name: "Dashu Cica Pad", price: "$20.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Musinsa Global", matchReason: "면도를 마친 후 턱 부위에 차가운 시카 패드를 3분간 얹어 상처 열감을 완벽히 빼주세요." }, alternatives: [ { name: "Dr.G Red Blemish Men Cleanser", price: "$19.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, { name: "Innisfree Forest Shaving", price: "$14.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] },
    "Aging": { mains: [ { badge: "1st Choice", name: "Hera Homme Scrub", price: "$30.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora", matchReason: "피부를 칙칙하게 만드는 두꺼운 묵은 각질을 미세 알갱이로 확실하게 벗겨냅니다." }, { badge: "Great Alt", name: "IOPE Men Anti-Aging Wash", price: "$25.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon", matchReason: "세안만으로 탄력 케어가 시작되는 고영양 클렌징 폼입니다." }, { badge: "Sensitive Safe", name: "Sulwhasoo Men Foam", price: "$35.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora", matchReason: "거친 남성 피부결을 부드럽게 연화시키는 한방 프리미엄 폼입니다." } ], synergy: { badge: "Synergy Serum", name: "Laneige Homme Anti-Aging All-in-One", price: "$35.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon", matchReason: "각질이 제거된 상태에서 안티에이징 올인원을 발라 깊은 주름까지 영양을 흡수시키세요." }, alternatives: [ { name: "O HUI Meister Foam", price: "$28.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, { name: "Whoo Men Foam", price: "$40.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora" } ] }
  },
  "Toner": { // 🚨 [신규] 남성 스킨/로션 방 정식 개통!
    "Acne": { mains: [ { badge: "1st Choice", name: "Laneige Homme Active Water Skin", price: "$25.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "YesStyle", matchReason: "바르는 순간 물처럼 가볍게 스며들어 개기름과 끈적임을 0%로 잡아줍니다." }, { badge: "Great Alt", name: "Round Lab Pine Tree Soothing Cica Toner", price: "$20.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "소나무 소나무 추출물이 울긋불긋한 트러블 피지를 산뜻하게 컨트롤합니다." }, { badge: "Sensitive Safe", name: "Be Ready Cica Toner", price: "$18.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "알콜향 없이 모공을 청소해주는 저자극 워터 토너입니다." } ], synergy: { badge: "Synergy Cream", name: "Dr.G R.E.D Blemish Clear Cream", price: "$28.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global", matchReason: "토너로 피지를 닦아낸 후, 절대 모공을 막지 않는 수분 젤 크림으로 보습막을 씌우세요." }, alternatives: [ { name: "Innisfree Forest Trouble Skin", price: "$20.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Soko Glam" }, { name: "UrOS Skin Wash", price: "$18.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] },
    "Dryness": { mains: [ { badge: "1st Choice", name: "Innisfree Forest For Men Moisture Skin", price: "$22.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Soko Glam", matchReason: "거칠고 푸석한 남성 피부에 깊은 보습감을 주어 유수분 밸런스를 맞춥니다." }, { badge: "Great Alt", name: "Laneige Homme Blue Energy Essence in Lotion", price: "$32.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora", matchReason: "스킨과 로션이 결합된 에센스 형태로 건성 피부에 확실한 영양을 줍니다." }, { badge: "Sensitive Safe", name: "Pyunkang Yul Essence Toner", price: "$19.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon", matchReason: "물 대신 황기 추출물을 사용하여 악건성 피부에 쫀쫀하게 흡수됩니다." } ], synergy: { badge: "Synergy Cream", name: "Zeroid Intensive Cream", price: "$30.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon", matchReason: "보습 스킨을 바른 후 피부과 장벽 크림을 덧발라 수분이 날아가는 것을 완벽 차단하세요." }, alternatives: [ { name: "Hera Homme Essence in Skin", price: "$45.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" }, { name: "IOPE Men Bio Essence", price: "$40.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] },
    "Redness": { mains: [ { badge: "1st Choice", name: "Biotherm Homme Aquapower Toner", price: "$45.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Sephora", matchReason: "면도날에 긁히고 화끈거리는 턱을 얼음처럼 차갑고 편안하게 진정시킵니다." }, { badge: "Great Alt", name: "Dr.G Red Blemish For Men Toner", price: "$24.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "시카 성분이 듬뿍 들어있어 면도 상처에도 따갑지 않은 무알콜 토너입니다." }, { badge: "Sensitive Safe", name: "Ideal For Men Cica Toner", price: "$20.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Musinsa Global", matchReason: "자극받아 붉게 달아오른 남성 피부의 온도를 즉각적으로 낮춰줍니다." } ], synergy: { badge: "Synergy Cream", name: "Dr.Jart+ For Men Calming Cream", price: "$32.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Sephora", matchReason: "진정 토너로 열을 내린 후 더마 쿨링 크림으로 홍조를 한 번 더 덮어 확실히 식혀주세요." }, alternatives: [ { name: "BRTC Homme Cica Toner", price: "$22.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, { name: "O HUI Meister Soothing Toner", price: "$30.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] }
  },
  "Serum": {
    "Acne": { mains: [ { badge: "1st Choice", name: "Ideal For Men Perfect Water Gel", price: "$28.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "개기름을 싹 잡아주고 모공을 막지 않는 수분 폭탄 산뜻 젤 올인원입니다." }, { badge: "Great Alt", name: "Be Ready Cica All-in-one", price: "$22.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "끈적임 없이 스며들어 트러블과 뾰루지를 즉각 잠재웁니다." }, { badge: "Sensitive Safe", name: "Dashu Aqua All-in-one", price: "$20.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "바르자마자 물처럼 변하는 산뜻한 텍스처로 남성들의 호불호가 없습니다." } ], synergy: { badge: "Synergy Cream", name: "Dr.G Red Blemish For Men Cream", price: "$28.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global", matchReason: "가을/겨울철 건조함이 심할 때만 올인원 위에 산뜻한 젤 크림을 한 번 더 코팅해 주세요." }, alternatives: [ { name: "Innisfree Forest Fresh All-in-one", price: "$22.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Soko Glam" }, { name: "Black Monster All-in-one", price: "$25.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] },
    "Dryness": { mains: [ { badge: "1st Choice", name: "UrOS Skin Milk", price: "$29.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon", matchReason: "극건성 피부의 하얗게 일어난 각질과 속당김을 한 번에 잡아주는 쫀쫀한 밀크입니다." }, { badge: "Great Alt", name: "Ideal For Men Moisture All-in-one", price: "$26.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "수분이 날아가지 않게 꽉 잡아주는 겨울철 악건성 구원템입니다." }, { badge: "Premium Choice", name: "Laneige Homme Cream Skin Refiner", price: "$30.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora", matchReason: "크림 한 통을 스킨에 그대로 녹여내어 이것 하나만 발라도 당기지 않습니다." } ], synergy: { badge: "Synergy Cream", name: "Round Lab Birch Men Cream", price: "$22.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global", matchReason: "올인원을 발라도 뺨 부위가 당긴다면, 수분 크림을 건조한 부위에만 연고처럼 덧바르세요." }, alternatives: [ { name: "IOPE Men All-in-one", price: "$30.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, { name: "Hera Homme Essence in Emulsion", price: "$45.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Sephora" } ] },
    "Redness": { mains: [ { badge: "1st Choice", name: "Dr.G Red Blemish For Men All-in-One", price: "$32.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Olive Young Global", matchReason: "면도 후 피나고 화끈거리는 턱 피부를 즉각적으로 식혀주는 시카 쿨링 제형입니다." }, { badge: "Great Alt", name: "Ideal For Men Cica All-in-one", price: "$24.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Musinsa Global", matchReason: "사소한 마찰에도 붉어지는 예민한 피부를 위한 저자극 진정 올인원입니다." }, { badge: "Sensitive Safe", name: "Innisfree Forest Calming All-in-one", price: "$20.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon", matchReason: "상처가 난 부위에 듬뿍 발라도 전혀 따갑지 않은 극진정 포뮬러입니다." } ], synergy: { badge: "Synergy Cleanser", name: "Dashu Cica Cleanser", price: "$14.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "진정 올인원의 효과를 보려면, 세안부터 자극적인 멘톨 폼 대신 순한 시카 폼으로 바꾸세요." }, alternatives: [ { name: "BRTC Homme Cica All-in-one", price: "$24.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, { name: "O HUI Meister Soothing All-in-one", price: "$35.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] },
    "Aging": { mains: [ { badge: "1st Choice", name: "Lab Series Anti-Age Max LS Lotion", price: "$65.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Sephora", matchReason: "피곤하고 탄력을 잃어 처진 안색을 쫀쫀하게 끌어올려주는 남성 프리미엄 로션입니다." }, { badge: "Great Alt", name: "Hera Homme Black Perfect Fluid", price: "$55.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Sephora", matchReason: "블랙 트러플 추출물이 눈가와 팔자의 깊은 주름을 타격하는 럭셔리 라인입니다." }, { badge: "Smart Choice", name: "IOPE Men Anti-Aging All-in-One", price: "$45.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "스킨+로션+에센스를 한 병에 담아 탄력 잃고 늘어진 세로 모공을 타이트하게 조여줍니다." } ], synergy: { badge: "Synergy SunCare", name: "Ideal For Men Tone-Up Sun", price: "$22.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "자외선 방어 없이 안티에이징은 불가합니다. 티 안 나는 톤업 선크림으로 노화를 차단하세요." }, alternatives: [ { name: "Sulwhasoo Men Age Defying Fluid", price: "$70.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" }, { name: "Donginbi Homme Power Repair", price: "$60.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] }
  },
  "Cream": {
    "Acne": { mains: [ { badge: "1st Choice", name: "Be Ready Cica Soothing Gel Cream", price: "$25.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Musinsa Global", matchReason: "트러블 피부도 안심하고 바르는 산뜻하고 쿨링감 넘치는 젤 크림입니다." }, { badge: "Great Alt", name: "Dr.G R.E.D Blemish Clear Cream", price: "$28.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "여드름성 남성 피부의 모공을 절대 막지 않는 올리브영 남녀통합 1위 크림입니다." }, { badge: "Sensitive Safe", name: "Ideal For Men Cica Cream", price: "$22.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Olive Young Global", matchReason: "붉은 여드름 흉터와 면도 상처를 동시에 잠재우는 시카 젤입니다." } ], synergy: { badge: "Synergy Cleanser", name: "Dashu Acne Cleanser", price: "$14.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon", matchReason: "피지 분비가 폭발하는 날에는 BHA 성분의 폼클렌저와 크림을 꼭 병행하세요." }, alternatives: [ { name: "Innisfree Trouble Cream", price: "$18.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Soko Glam" }, { name: "Black Monster Cica Cream", price: "$16.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] },
    "Dryness": { mains: [ { badge: "1st Choice", name: "Zeroid Intensive Cream", price: "$30.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "피부과에서 건성 환자에게 가장 먼저 처방하는 허연 각질 박멸 묵직 장벽 크림입니다." }, { badge: "Great Alt", name: "Round Lab Birch Men Cream", price: "$22.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "남성들이 싫어하는 끈적임은 빼고 쫀쫀한 수분감만 남겨 속당김을 완벽히 해결합니다." }, { badge: "Sensitive Safe", name: "Illiyoon Ceramide Ato Cream", price: "$24.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon", matchReason: "극건성 피부의 찢어질 듯한 당김을 방어하는 대용량 캡슐 세라마이드입니다." } ], synergy: { badge: "Synergy Serum", name: "UrOS Skin Conditioner", price: "$25.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon", matchReason: "크림을 얹기 전 스킨 컨디셔너로 피부 속 수분길을 흠뻑 적셔두면 보습력이 2배 길어집니다." }, alternatives: [ { name: "Laneige Homme Blue Cream", price: "$30.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" }, { name: "IOPE Men Moisture Cream", price: "$32.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] },
    "Aging": { mains: [ { badge: "1st Choice", name: "Hera Homme Perfect Cream", price: "$65.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Sephora", matchReason: "눈에 띄기 시작하는 주름과 푸석한 탄력을 쫀쫀하게 리프팅하는 남성 프리미엄 크림입니다." }, { badge: "Great Alt", name: "IOPE Men Anti-Aging Cream", price: "$55.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon", matchReason: "노화로 인해 세로로 길게 처지는 모공을 타이트하게 조여주는 영양 크림입니다." }, { badge: "Sensitive Safe", name: "Sulwhasoo Men Age Defying Cream", price: "$85.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora", matchReason: "진귀한 한방 성분이 지치고 얇아진 피부 장벽을 튼튼하고 밀도 있게 세웁니다." } ], synergy: { badge: "Synergy SunCare", name: "Ideal For Men Tone-Up Sun", price: "$22.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "노화의 주범 1순위는 자외선입니다! 안티에이징 크림을 바른 아침엔 톤업 선크림이 필수입니다." }, alternatives: [ { name: "O HUI Meister Cream", price: "$58.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, { name: "Donginbi Homme Power Cream", price: "$70.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] }
  },
  "SunCare": {
    "Acne": { mains: [ { badge: "1st Choice", name: "Be Ready No Sebum Sun", price: "$18.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "오후만 되면 뿜어져 나오는 개기름을 싹 잡아 머리카락도 안 붙는 무광 선크림입니다." }, { badge: "Great Alt", name: "Dashu Daily Sun Stick", price: "$16.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "손에 화장품을 묻히기 싫은 남성들을 위해, 밖에서도 쓱쓱 문지르면 끝나는 뽀송 스틱입니다." }, { badge: "Sensitive Safe", name: "Dr.G Red Blemish Sun Men", price: "$22.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "트러블 피부도 안심하고 바를 수 있도록 모공 막힘을 최소화한 더마 수분 자차입니다." } ], synergy: { badge: "Synergy Cleanser", name: "Ideal For Men Perfect Foam", price: "$15.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global", matchReason: "선크림을 바른 날 밤에는 모공 속에 잔여물이 남지 않도록 세정력이 확실한 폼으로 씻어내세요." }, alternatives: [ { name: "Innisfree Forest Sun", price: "$15.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, { name: "UrOS Sun Block", price: "$18.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] },
    "Dryness": { mains: [ { badge: "1st Choice", name: "Round Lab Birch Men Sun", price: "$19.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "얼굴만 동동 뜨는 백탁 없이, 자작나무 수액이 스킨로션처럼 부드럽고 촉촉하게 스며듭니다." }, { badge: "Great Alt", name: "Ideal For Men Moisture Sun", price: "$20.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Musinsa Global", matchReason: "건조한 각질을 꾹 눌러주어 하얗게 뜨지 않는 보습 특화 에센스 선크림입니다." }, { badge: "Sensitive Safe", name: "Laneige Homme Sun BB", price: "$25.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Sephora", matchReason: "수분감 넘치는 베이스로 자연스러운 톤 보정 효과까지 동시에 제공합니다." } ], synergy: { badge: "Synergy Serum", name: "UrOS Skin Conditioner", price: "$25.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "보습 선크림을 바르기 전 올인원으로 수분 베이스를 탄탄히 깔아두면 하루 종일 당기지 않습니다." }, alternatives: [ { name: "IOPE Men Sun", price: "$28.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, { name: "Hera Homme Sun", price: "$35.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Sephora" } ] },
    "Aging": { mains: [ { badge: "1st Choice", name: "Dashu Men's Tone-up BB Lotion", price: "$24.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Musinsa Global", matchReason: "피곤하고 칙칙해진 안색을 화사하게 밝히며 자외선까지 완벽 차단하는 베스트셀러입니다." }, { badge: "Great Alt", name: "Ideal For Men Tone-Up Sun", price: "$22.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "비비크림이 부담스러운 남성들을 위해 백탁 없이 반 톤만 자연스럽게 안색을 교정합니다." }, { badge: "Premium Choice", name: "Hera Homme UV Defense", price: "$35.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Sephora", matchReason: "자외선으로 인한 깊은 광노화를 완벽하게 방어하는 프리미엄 안티에이징 선크림입니다." } ], synergy: { badge: "Synergy Serum", name: "Laneige Homme Anti-Aging", price: "$35.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Sephora", matchReason: "선크림 전 단계에 탄력 전용 에센스를 발라주면 색소 침착과 주름을 이중으로 방어할 수 있습니다." }, alternatives: [ { name: "Sulwhasoo Men UV", price: "$45.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Sephora" }, { name: "IOPE Men UV Shield", price: "$30.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] }
  },
  "Makeup": {
    "ToneUp": { mains: [ { badge: "1st Choice", name: "Obge Natural Cover Foundation (Stick/Lotion)", price: "$34.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "손에 묻히지 않고 대충 쓱쓱 긋고 문질러도 화장한 티 없이 피부톤이 맑아지는 마법의 비비스틱입니다." }, { badge: "Great Alt", name: "Dashu Men's Tone-up BB Lotion", price: "$24.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Musinsa Global", matchReason: "스킨로션처럼 편하게 펴 바르면 칙칙한 안색과 잔모공을 뽀얗게 블러 처리해 줍니다." }, { badge: "Sensitive Safe", name: "Ideal For Men Blemish Cover BB", price: "$22.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Olive Young Global", matchReason: "여드름 피부도 모공 막힘 걱정 없이 매끄럽게 안색을 정돈하는 순한 비비입니다." } ], synergy: { badge: "Synergy Cleanser", name: "Ideal For Men Perfect Foam", price: "$15.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Olive Young Global", matchReason: "톤업 크림도 메이크업입니다! 잘 때 피부가 숨 쉴 수 있도록 세정력 강한 폼으로 꼭 세안하세요." }, alternatives: [ { name: "Black Monster BB", price: "$18.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, { name: "Innisfree Forest BB", price: "$15.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] },
    "Base": { mains: [ { badge: "1st Choice", name: "Be Ready Magnetic Fitting Cushion", price: "$29.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Musinsa Global", matchReason: "손에 화장품 묻히기 싫은 남성들을 위해, 퍼프로 두드리기만 하면 붉은기와 수염 자국을 완벽하게 덮어줍니다." }, { badge: "Great Alt", name: "Be Ready Level Up Foundation", price: "$24.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "쿠션보다 더 정교하고 지속력이 강력하여, 중요한 미팅이나 면접 날 완벽한 무결점 피부를 연출합니다." }, { badge: "Premium Choice", name: "Hera Homme BB", price: "$35.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Sephora", matchReason: "고급스러운 텍스처로 남성의 굵은 모공 요철을 티 안 나게 메워주는 백화점 1위 비비입니다." } ], synergy: { badge: "Synergy Concealer", name: "Dashu Daily Concealer", price: "$14.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "전체 화장이 부담스러운 날에는, 파운데이션 대신 컨실러로 눈 밑 다크서클과 점만 살짝 가리세요." }, alternatives: [ { name: "IOPE Men Air Cushion", price: "$30.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, { name: "Obge Natural Cover", price: "$28.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] },
    "Lip": { mains: [ { badge: "1st Choice", name: "Black Monster Black Balm (Dual)", price: "$14.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "StyleKorean", matchReason: "허여멀건해 아파 보이는 안색에 즉각적인 생기를 부여하며 보습과 붉은 발색을 마음대로 조절할 수 있습니다." }, { badge: "Great Alt", name: "Dashu Men's Double Appeal Lip", price: "$12.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Amazon", matchReason: "여성용 립스틱처럼 번들거리는 튀김 광택을 싹 빼고 자연스러운 매트 질감만 남긴 남자 전용 립밤입니다." }, { badge: "Sensitive Safe", name: "Ideal For Men Color Lip Balm", price: "$10.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "과하게 붉어지는 게 부담스러운 입문자를 위한, 가장 은은하고 건강한 코랄/피치 발색입니다." } ], synergy: { badge: "Synergy Spray", name: "Dashu Men's Hair Spray", price: "$18.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Amazon", matchReason: "입술에 생기를 주어 인상이 깔끔해졌다면, 잔머리 없이 헤어를 고정해 완벽한 그루밍을 완성하세요." }, alternatives: [ { name: "Grafen Lip Balm", price: "$14.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Amazon" }, { name: "Obge Lip Balm", price: "$14.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Olive Young Global" } ] },
    "Eye": { mains: [ { badge: "1st Choice", name: "Dasique Men's Perfect Magic Sniper Brow", price: "$15.00", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80", link: "#", vendor: "Olive Young Global", matchReason: "화장 완전 똥손도 짱구 눈썹이 되지 않게 연하게 발색되며, 비어있는 꼬리만 쓱쓱 채워 인상을 또렷하게 만듭니다." }, { badge: "Great Alt", name: "Laka Wild Brow Shaper", price: "$15.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global", matchReason: "숱은 많은데 지저분한 눈썹을 빗어 올려 깔끔한 결을 강력하게 고정해 주는 투명 젤 픽서입니다." }, { badge: "Sensitive Safe", name: "Grafen Eyebrow Pencil", price: "$14.00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80", link: "#", vendor: "Amazon", matchReason: "펜슬 심이 납작하게 깎여 있어 남성의 두꺼운 눈썹 선에 맞춰 직관적이고 빠르게 그리기 쉽습니다." } ], synergy: { badge: "Synergy Base", name: "Be Ready Magnetic Fitting Cushion", price: "$29.00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80", link: "#", vendor: "Musinsa Global", matchReason: "눈썹을 날렵하게 다듬었다면 남성 전용 쿠션으로 턱수염 자국을 살짝 가려 이목구비 입체감을 폭발시키세요." }, alternatives: [ { name: "Ideal For Men Brow", price: "$13.00", img: "https://images.unsplash.com/photo-1611077544760-4c4f068fcce3?q=80", link: "#", vendor: "Olive Young Global" }, { name: "Black Monster Brow", price: "$12.00", img: "https://images.unsplash.com/photo-1608248593842-83e843e9fa82?q=80", link: "#", vendor: "Amazon" } ] }
  }
};

function getSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
  return hash;
}
function shuffleArraySeeded(array, seed) {
  let shuffled = [...array]; let currentSeed = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
      let randomVal = Math.sin(currentSeed++) * 10000;
      randomVal = randomVal - Math.floor(randomVal);
      const j = Math.floor(randomVal * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  } return shuffled;
}

// 🚨 9대 글로벌 구매처 + 초정밀 검색어 요격(Diet) 엔진 업그레이드
function getSearchLink(vendor, productName) {
  // 1. [초강력 검색어 다이어트]: 벤더사 검색 엔진을 고장 내는 수식어 원천 차단
  let cleanName = productName
    .replace(/\(.*\)/g, '') // 괄호와 그 안의 내용 제거
    .replace(/Men's|For Men/gi, '') // 남성용 표기 제거
    .replace(/Perfect|Magic|Sniper|Double|Appeal|Intensive|Advanced|EX|Plus|Premium|Solution|Essential/gi, '') // 쓸데없이 긴 마케팅 수식어 제거
    .replace(/[0-9]+(ml|g|oz|x)/gi, '') // 용량 및 수량 표기 제거
    .replace(/[:\-+]/g, ' ') // 검색 오류를 유발하는 특수기호(+, -, :)를 공백으로 치환 (예: Dr.Jart+ -> Dr.Jart)
    .trim();

  // 2. [단어 수 제한 필터]: 검색어가 5단어를 넘어가면 뒤쪽 수식어 때문에 검색이 꼬임. 핵심인 앞 4단어만 추출.
  // 예: "Make Prem Safe me Relief Moisture Cream" -> "Make Prem Safe me" (이것만 쳐도 100% 나옴)
  let words = cleanName.split(/\s+/).filter(word => word.length > 0);
  if (words.length > 4) {
    // 단, Mask, Sun, Cream 같은 카테고리 단어가 잘려나가면 엉뚱한 게 나오므로 카테고리 명사는 끝에 붙여줌
    const categoryKeywords = ["Mask", "Sun", "Cream", "Serum", "Toner", "Cleanser", "Pad", "Tint", "Cushion"];
    const lastWord = words[words.length - 1];
    
    cleanName = words.slice(0, 4).join(' ');
    
    // 잘려나간 마지막 단어가 핵심 카테고리 명사라면 다시 붙여주기
    if (categoryKeywords.some(kw => lastWord.includes(kw)) && !cleanName.includes(lastWord)) {
      cleanName += ' ' + lastWord;
    }
  }

  const query = encodeURIComponent(cleanName);
  
  // 3. [스마트 라우팅]: DB 지정값 무시, 특정 브랜드는 무조건 생존 확률이 가장 높은 독점 몰로 강제 납치!
  let finalVendor = vendor; 
  
  if (productName.includes("Ideal For Men") || productName.includes("Bring Green") || productName.includes("Wakemake")) {
    finalVendor = "Olive Young Global"; // 올리브영 PB 브랜드 강제 할당
  } else if (productName.includes("Be Ready") || productName.includes("Dashu") || productName.includes("Obge") || productName.includes("Black Monster")) {
    if (!["Amazon", "Musinsa Global", "Olive Young Global"].includes(finalVendor)) {
      finalVendor = "Musinsa Global"; // D2C 남성 브랜드 우회
    }
  } else if (productName.includes("Sulwhasoo") || productName.includes("Laneige") || productName.includes("Hera")) {
    if (!["Amazon", "Sephora"].includes(finalVendor)) {
      finalVendor = "Sephora"; // 아모레퍼시픽 럭셔리 라인 우회
    }
  }

  // 4. 최종 확정된 쇼핑몰 검색 URL 생성
  const links = {
    "YesStyle": `https://www.yesstyle.com/en/list.html?q=${query}`,
    "Olive Young Global": `https://global.oliveyoung.com/display/search?query=${query}`,
    "Musinsa Global": `https://global.musinsa.com/search?q=${query}`,
    "StyleKorean": `https://www.stylekorean.com/shop/search_result.php?keyword=${query}`,
    "Soko Glam": `https://sokoglam.com/search?q=${query}`,
    "Amazon": `https://www.amazon.com/s?k=${query}`,
    "Sephora": `https://www.sephora.com/search?keyword=${query}`,
    "Jolse": `https://jolse.com/product/search.html?keyword=${query}`,
    "Stylevana": `https://www.stylevana.com/en_US/catalogsearch/result/?q=${query}`
  };
  
  return links[finalVendor] || `https://www.google.com/search?q=${query}`;
}

startGenderBtns.forEach(btn => {
  btn.addEventListener('click', function() {
    userGender = this.getAttribute('data-gender'); 
    userProfile = {}; targetCategory = ""; primaryFocus = ""; historyStack = []; 
    historyStack.push('homeScreen'); 
    
    document.getElementById('emailFormGroup').classList.remove('hidden');
    document.getElementById('emailSuccessMsg').classList.add('hidden');
    document.getElementById('userEmailInput').value = '';
    document.getElementById('emailSubmitBtn').innerText = 'SEND TO MY INBOX';

    // 🚨 스킨타입(Step 0) 버튼들 타겟 남/녀 동적 할당
    const q0Btns = document.querySelectorAll('.q0-btn');
    q0Btns.forEach(q0btn => {
      q0btn.setAttribute('data-target', userGender === "Men" ? "q1-men" : "q1Screen");
    });

    homeScreen.classList.add('hidden'); 
    loadingScreen.classList.remove('hidden');
    
    setTimeout(() => { 
      loadingScreen.classList.add('hidden'); 
      // 무조건 피부 타입 방(Q0)으로 먼저 이동!
      document.getElementById('q0-skin-type').classList.remove('hidden'); 
    }, 1200); 
  });
});

answerButtons.forEach(function(btn) {
  btn.addEventListener('click', function() {
    historyStack.push(this.closest('.card-container').id);
    if (this.hasAttribute('data-category')) targetCategory = this.getAttribute('data-category');
    if (this.hasAttribute('data-focus')) primaryFocus = this.getAttribute('data-focus');
    
    const currentScreen = this.closest('.card-container');
    const stepName = currentScreen.querySelector('.step-indicator').innerText;
    userProfile[stepName] = this.innerText;
    
    currentScreen.classList.add('hidden');
    const targetScreenId = this.getAttribute('data-target');
    const targetScreen = document.getElementById(targetScreenId);
    targetScreen.classList.remove('hidden');
    
    if (targetScreenId === 'analyzeScreen') {
      // 🚨 안전 장치 세팅
      if (!targetCategory) targetCategory = "Cream"; 
      if (!primaryFocus) { primaryFocus = (targetCategory === "Makeup") ? "Base" : "Aging"; }
      
      const dynamicText = document.getElementById('dynamicLoadingText');
      const loadFill = document.getElementById('loadingFill');
      
      // 🧠 [핵심] 고객 피부 타입 추출 (긴 문장에서 앞 단어 Oily, Dry 등만 뽑아냄)
      let rawSkinType = userProfile["Step 0 (Skin Profile)"] || "Sensitive";
      let shortSkinType = rawSkinType.split(' ')[0]; 

      dynamicText.style.opacity = 0; 
      loadFill.style.width = "0%";
      
      // 1단계: 피부 타입 스캔 (0초~1.5초)
      setTimeout(() => { 
        dynamicText.innerHTML = `AI 정밀 진단: <span style='color:var(--hims-accent); font-weight:600;'>[${shortSkinType}]</span> 타입 데이터 분석 중...`; 
        dynamicText.style.opacity = 1; 
        loadFill.style.width = "35%"; 
      }, 100);
      
      // 2단계: 핵심 고민 필터링 (1.5초~3초)
      setTimeout(() => { 
        dynamicText.style.opacity = 0; 
        setTimeout(() => { 
          dynamicText.innerHTML = `1,420개 K-Beauty 성분 중 <span style='color:var(--hims-bronze); font-weight:600;'>[${primaryFocus}]</span> 최적 성분 필터링 중...`; 
          dynamicText.style.opacity = 1; 
          loadFill.style.width = "70%"; 
        }, 300); 
      }, 1500);
      
      // 3단계: 시너지 계산 (3초~4.5초)
      setTimeout(() => { 
        dynamicText.style.opacity = 0; 
        setTimeout(() => { 
          dynamicText.innerText = "완벽한 처방을 위해 카테고리별 시너지 조합을 최종 계산합니다..."; 
          dynamicText.style.opacity = 1; 
          loadFill.style.width = "100%"; 
        }, 300); 
      }, 3000);
      
      // 🚀 잃어버린 제품 렌더링 엔진 (4.5초 로딩 끝난 직후 실행)
      setTimeout(function() {
        // 1. DB에서 루틴 꺼내오기
        let routine;
        try { routine = (userGender === "Men") ? crossSellDB_Men[targetCategory][primaryFocus] : crossSellDB[targetCategory][primaryFocus]; } 
        catch (e) { routine = (userGender === "Men") ? crossSellDB_Men["Cream"]["Dryness"] : crossSellDB["Cream"]["Dryness"]; }

        // 2. 할인 UI 생성 함수
        function getDiscountHTML(priceStr) {
          return `<div class="price-wrapper"><span class="discount-badge">Up to 25% OFF</span><span class="discount-price" style="color: var(--hims-text); font-size: 15px;">Est. ${priceStr}</span></div>`;
        }

        // 3. 메인 제품 3개 화면에 렌더링
        const mainGrid = document.getElementById('mainProductsGrid');
        mainGrid.innerHTML = '';
        routine.mains.forEach(mainItem => {
          const finalLink = getSearchLink(mainItem.vendor, mainItem.name);
          mainGrid.innerHTML += `
            <div class="product-item">
              <div class="product-header">
                <img src="${mainItem.img}" class="product-img">
                <div class="product-info">
                  <div class="product-step-badge" style="background-color: ${userGender === 'Men' ? '#4A5D4E' : 'var(--hims-accent)'};">${mainItem.badge}</div>
                  <div class="product-name">${mainItem.name}</div>
                  ${getDiscountHTML(mainItem.price)}
                </div>
              </div>
              <div class="match-reason">
                <strong style="color:var(--hims-accent); display:block; margin-bottom:5px; font-size:12px;">✨ AI 맞춤 정밀 리포트</strong>
                <span style="color:#555; font-size:11px; line-height:1.5;"><span style="color:var(--hims-text); font-weight:600;">🎯 매칭 포인트:</span> ${mainItem.matchReason}</span>
              </div>
              <a href="${finalLink}" target="_blank" class="kbeauty-link-btn" style="background-color: ${userGender === 'Men' ? '#2c362f' : '#d9534f'}; color: white;">🔥 GET IT NOW ➔</a>
            </div>
          `;
        });

        // 4. 시너지 제품 렌더링
        const synLink = getSearchLink(routine.synergy.vendor, routine.synergy.name);
        document.getElementById('synergyProductShowcase').innerHTML = `
          <div class="product-item">
            <div class="product-header">
              <img src="${routine.synergy.img}" class="product-img">
              <div class="product-info">
                <div class="product-step-badge" style="color:#1D1D1B; border-color:#1D1D1B; background: transparent;">${routine.synergy.badge}</div>
                <div class="product-name">${routine.synergy.name}</div>
                ${getDiscountHTML(routine.synergy.price)}
              </div>
            </div>
            <div class="match-reason" style="border-top:none; padding-top:0;">
              <strong style="color:#1D1D1B; display:block; margin-bottom:5px; font-size:12px;">💡 Expert Tip: 200% 부스팅 전략</strong>
              <span style="color:#555; font-size:11px; line-height:1.5;"><span style="color:var(--hims-text); font-weight:600;">🚀 시너지 효과:</span> ${routine.synergy.matchReason}</span>
            </div>
            <a href="${synLink}" target="_blank" class="kbeauty-link-btn" style="background-color: #555; color: white;">🔥 ADD TO ROUTINE ➔</a>
          </div>
        `;

        // 5. 대안 제품 렌더링
        const answerString = Object.values(userProfile).join("");
        const userSeed = getSeed(answerString);
        const shuffledAlternatives = shuffleArraySeeded(routine.alternatives, userSeed);
        const itemsToShow = (targetCategory === "Makeup") ? shuffledAlternatives.slice(0, 4) : shuffledAlternatives.slice(0, 2); 
        const altShowcase = document.getElementById('altProductShowcase');
        altShowcase.innerHTML = ''; 
        itemsToShow.forEach(alt => {
          const finalAltLink = getSearchLink(alt.vendor, alt.name);
          altShowcase.innerHTML += `
            <div class="product-item">
              <div class="product-header">
                <img src="${alt.img}" class="product-img">
                <div class="product-info">
                  <div class="product-name">${alt.name}</div>
                  <div class="product-price">${alt.price}</div>
                  <a href="${finalAltLink}" target="_blank" class="kbeauty-link-btn" style="display:inline-block; width:auto; padding:6px 12px; margin-top:5px; background-color: #f0f0f0; color: #333;">Shop on ${alt.vendor} ➔</a>
                </div>
              </div>
            </div>
          `;
        });

        // 6. 최근 기록(로컬스토리지)에 이번 진단 저장
        const newHistoryItem = {
          gender: userGender,
          category: targetCategory,
          focus: primaryFocus,
          profile: userProfile,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
        let currentHistory = JSON.parse(localStorage.getItem('seouria_history') || '[]');
        currentHistory = [newHistoryItem, ...currentHistory.filter(h => h.category !== targetCategory)].slice(0, 3);
        localStorage.setItem('seouria_history', JSON.stringify(currentHistory));

        // 7. 모든 준비가 끝나면 결과창 화면에 띄우기
        document.getElementById('analyzeScreen').classList.add('hidden');
        document.getElementById('resultScreen').classList.remove('hidden');
        window.scrollTo(0, 0); // 사용자가 위에서부터 볼 수 있게 스크롤 맨 위로!
      }, 4500);
    }
  });
});

backButtons.forEach(function(btn) {
  btn.addEventListener('click', function() {
    if (historyStack.length > 0) {
      const currentScreen = this.closest('.card-container');
      const prevScreenId = historyStack.pop();
      const stepIndicator = currentScreen.querySelector('.step-indicator');
      if(stepIndicator) { delete userProfile[stepIndicator.innerText]; }
      currentScreen.classList.add('hidden');
      document.getElementById(prevScreenId).classList.remove('hidden');
    }
  });
});

// ============================================================================
// 🎯 [Seouria DB 연동] 구글 스프레드시트 최종 전송 (진짜 통로 연결 완료)
// ============================================================================
const emailSubmitBtn = document.getElementById('emailSubmitBtn');
const userEmailInput = document.getElementById('userEmailInput');
const emailFormGroup = document.getElementById('emailFormGroup');
const emailSuccessMsg = document.getElementById('emailSuccessMsg');

// 📍 방금 보내주신 진짜 폼 ID를 반영한 전송 주소입니다.
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScohz4qLi9pI61957kydlE5sVTJonqVmzijOsdlYJlY0-GpDQ/formResponse";
const EMAIL_ENTRY_ID = "entry.1549818009"; 

if (emailSubmitBtn) {
  emailSubmitBtn.addEventListener('click', function() {
    const emailVal = userEmailInput.value.trim();
    const privacyConsent = document.getElementById('privacyConsent');
    const consentText = document.getElementById('consentText');
    
    // 🚨 1. 개인정보 동의 체크 확인 로직
    if (!privacyConsent.checked) {
      consentText.classList.add('error-flash'); // 빨간색으로 깜빡임
      setTimeout(() => consentText.classList.remove('error-flash'), 1500);
      return; // 체크 안하면 전송 중지
    }

    // 🚨 2. 이메일 유효성 검사 로직
    if(emailVal === "" || !emailVal.includes("@")) {
      userEmailInput.style.border = "1.5px solid #d9534f";
      setTimeout(() => userEmailInput.style.border = "1px solid rgba(184, 156, 130, 0.4)", 2000);
      return; // 전송 중지
    }
    
    emailSubmitBtn.innerText = "SENDING...";

    // 페이지 이동 방지용 숨겨진 프레임
    let iframe = document.getElementById('hidden_confirm');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'hidden_confirm';
      iframe.name = 'hidden_confirm';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }

    // 전송용 폼 생성
    const targetForm = document.createElement('form');
    targetForm.action = GOOGLE_FORM_URL;
    targetForm.method = 'POST';
    targetForm.target = 'hidden_confirm';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = EMAIL_ENTRY_ID;
    input.value = emailVal;

    targetForm.appendChild(input);
    document.body.appendChild(targetForm);

    // 전송 실행
    targetForm.submit();

    // UI 업데이트
    setTimeout(() => {
      if (document.body.contains(targetForm)) {
        document.body.removeChild(targetForm);
      }
      emailFormGroup.classList.add('hidden');
      emailSuccessMsg.classList.remove('hidden');
      console.log("🎯 Seouria DB 전송 성공! 이메일:", emailVal);
    }, 800);
  });
}
/* ============================================================================
   🛡️ [데이터 보호] 새로고침(F5) 방어 & 모바일 스와이프(뒤로가기) 연동
   ============================================================================ */

// 1. 실수로 새로고침이나 창 닫기 누름 방지
window.addEventListener('beforeunload', function (e) {
  // 진단을 시작했고, 아직 이메일을 전송하지 않은 상태라면 브라우저 경고창 발생
  if (historyStack.length > 0 && !document.getElementById('emailFormGroup').classList.contains('hidden')) {
    e.preventDefault();
    e.returnValue = ''; // 최신 브라우저 규격에 맞춘 필수 코드
  }
});

// 2. 모바일 스와이프(네이티브 뒤로가기) 제어
// 사용자가 '다음'으로 넘어갈 때마다 브라우저 기록에 가짜 히스토리를 심어줍니다.
startGenderBtns.forEach(btn => {
  btn.addEventListener('click', () => history.pushState(null, '', window.location.href));
});

answerButtons.forEach(btn => {
  btn.addEventListener('click', () => history.pushState(null, '', window.location.href));
});

// 실제로 스마트폰을 스와이프해서 뒤로 가기를 실행했을 때의 동작
window.addEventListener('popstate', function(e) {
  if (historyStack.length > 0) {
    const prevScreenId = historyStack.pop();
    const currentScreen = document.querySelector('.active-card');
    
    if (currentScreen) {
      // 선택했던 답변 기록 삭제 (다시 선택할 수 있도록 초기화)
      const stepIndicator = currentScreen.querySelector('.step-indicator');
      if(stepIndicator) { delete userProfile[stepIndicator.innerText]; }
      
      // 현재 화면을 없애고 이전 화면으로 부드럽게 복귀
      currentScreen.classList.remove('active-card');
    }
    document.getElementById(prevScreenId).classList.add('active-card');
  }
});
// 🔒 [기능] 개인정보 처리방침 모달 제어
window.openPrivacyModal = function() {
  document.getElementById('privacyModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // 뒷배경 스크롤 방지
};

window.closePrivacyModal = function() {
  document.getElementById('privacyModal').classList.add('hidden');
  document.body.style.overflow = 'auto'; // 스크롤 다시 허용
};

// 모달 바깥 영역 클릭 시 닫기
window.onclick = function(event) {
  const modal = document.getElementById('privacyModal');
  if (event.target == modal) {
    closePrivacyModal();
  }
};