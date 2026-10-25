export function initNovaPoshtaWidget(containerId, callback) {
  const container = document.getElementById(containerId);
  if (!container) return console.error("❌ Контейнер не знайдено:", containerId);

  console.log("🔧 Ініціалізуємо Nova Poshta Widget...");

  container.innerHTML = `
    <div class="space-y-4 relative">
      <div>
        <label class="block text-sm font-medium">📦 Введіть місто</label>
        <input type="text" id="np-city-input" class="w-full px-2 py-1 border rounded" placeholder="Почніть вводити назву міста...">
        <ul id="np-city-suggestions" class="absolute z-10 bg-white border w-full mt-1 rounded shadow max-h-40 overflow-y-auto hidden"></ul>
      </div>
      <div>
        <label class="block text-sm font-medium">🌐 Область</label>
        <input type="text" id="np-region-display" class="w-full px-2 py-1 border rounded bg-gray-100" readonly>
      </div>
      <div>
        <label class="block text-sm font-medium">🏞️ Район (необов'язково)</label>
        <input type="text" id="region" name="region" placeholder="Наприклад: Подільський" class="w-full px-2 py-1 border rounded" />
      </div>
      <div>
        <label class="block text-sm font-medium">📦 Відділення</label>
        <select id="np-warehouse-select" class="w-full px-2 py-1 border rounded" disabled>
          <option>Спочатку оберіть місто</option>
        </select>
      </div>
    </div>
  `;

  // === helpers ===
  function setHiddenAndNotify(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = val ?? "";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function readDraft() {
    try { return JSON.parse(localStorage.getItem("customerDraft_v2") || "null"); }
    catch { return null; }
  }

  const input = document.getElementById("np-city-input");
  const regionDisplay = document.getElementById("np-region-display");
  const warehouseSelect = document.getElementById("np-warehouse-select");
  const suggestionsBox = document.getElementById("np-city-suggestions");
  const districtInput = document.getElementById("region");

  let cities = [];
  let cityData = null;
  let warehouses = [];

  // --- search city ---
  input.addEventListener("input", async () => {
    const query = input.value.trim();
    if (query.length < 3) {
      suggestionsBox.classList.add("hidden");
      return;
    }
    try {
      const res = await fetch('/.netlify/functions/shipping-directory?'+new URLSearchParams({kind:'cities',q:query}));
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'NP_DIRECTORY_UNAVAILABLE_01543');
      cities = (json.items||[]).map(c=>({Ref:c.ref,Description:c.name,AreaDescription:c.region,SettlementTypeDescription:c.district}));
      suggestionsBox.replaceChildren(...cities.map(c=>{const li=document.createElement('li');li.className='px-2 py-1 hover:bg-blue-100 cursor-pointer';li.textContent=c.Description;li.dataset.npRef=c.Ref;return li;}));
      suggestionsBox.classList.remove("hidden");
    } catch (err) {
      console.error("❌ Помилка при пошуку міста:", err);
    }
  });

  // --- city pick ---
  suggestionsBox.addEventListener("click", (e) => {
    if (e.target.tagName !== "LI") return;
    const selectedText = e.target.textContent;
    input.value = selectedText;
    suggestionsBox.classList.add("hidden");

    cityData = cities.find(c => c.Ref === e.target.dataset.npRef);
    if (!cityData) return;

    regionDisplay.value = cityData.AreaDescription;

    // sync hidden + reset warehouse info
    setHiddenAndNotify("hidden-city", cityData.Description);
    setHiddenAndNotify("hidden-region", cityData.AreaDescription);
    setHiddenAndNotify("hidden-district", districtInput?.value || "");
    setHiddenAndNotify("hidden-warehouse", "");
    setHiddenAndNotify("hidden-street", "");
    setHiddenAndNotify("hidden-warehouse-number", "");
    setHiddenAndNotify("hidden-warehouse-type", "");

    loadWarehouses(cityData.Ref);
  });

  // --- warehouses loader ---
  async function loadWarehouses(cityRef, preferText = null) {
    try {
      const res = await fetch('/.netlify/functions/shipping-directory?'+new URLSearchParams({kind:'warehouses',cityRef:cityRef}));
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'NP_DIRECTORY_UNAVAILABLE_01543');
      warehouses = (json.items||[]).map(w=>({Ref:w.ref,Description:w.name,Number:w.number,ShortAddress:w.address,TypeOfWarehouse:w.typeRef}));

      warehouseSelect.replaceChildren(...warehouses.map(w=>{const option=document.createElement('option');option.value=w.Description;option.textContent=w.Description;return option;}));
      warehouseSelect.disabled = warehouses.length === 0;

      let targetText = preferText;
      if (targetText) {
        const norm = (v) => String(v || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const numberMatch = String(targetText).match(/№\s*(\d+)/u);
        const number = numberMatch?.[1] || '';
        const streetHint = norm(String(targetText).split(':').slice(1).join(':'));

        const matched = warehouses.find((w) => norm(w.Description) === norm(targetText)) ||
          warehouses.find((w) => number && (
            String(w.Number || '') === number ||
            new RegExp(`№\\s*${number}(?:\\D|$)`, 'u').test(String(w.Description || ''))
          ) && (!streetHint || norm(w.Description).includes(streetHint)));

        if (matched) targetText = matched.Description;
      }
      if (!targetText && warehouses.length > 0) targetText = warehouses[0].Description;

      if (targetText) {
        const exists = warehouses.some((w) => w.Description === targetText);
        if (exists) {
          warehouseSelect.value = targetText;
          updateSelectedWarehouse(targetText);
        } else {
          const opt = document.createElement('option');
          opt.value = targetText;
          opt.textContent = targetText;
          warehouseSelect.appendChild(opt);
          warehouseSelect.value = targetText;
        }
      }

      warehouseSelect.onchange = () => updateSelectedWarehouse(warehouseSelect.value);
      districtInput.oninput = () => updateSelectedWarehouse(warehouseSelect.value);
    } catch (err) {
      console.error("❌ Помилка при завантаженні відділень:", err);
    }
  }

  // --- warehouse change + sync hidden ---
  function updateSelectedWarehouse(selectedText) {
    const warehouse = warehouses.find(w => w.Description === selectedText);
    if (!warehouse) {
      console.warn("❌ Не знайдено відділення:", selectedText);
      return;
    }
    const lowerText = selectedText.toLowerCase();

    // number
    let number = warehouse.Number || "1";
    const m = selectedText.match(/№\s?(\d+)/);
    if (m) number = m[1];
    const warehouseNumber = `№${number}`;

    // type
    let type = "невідомий тип";
    if (lowerText.includes("поштомат")) type = "ПОШТОМАТ";
    else if (lowerText.includes("до 10 кг")) type = "до 10 кг";
    else if (lowerText.includes("до 30 кг")) type = "до 30 кг";

    // formatted number
    let formattedWarehouseNumber = warehouseNumber;
    if (lowerText.includes("мобільне")) formattedWarehouseNumber = `Мобільне відділення ${warehouseNumber}`;
    else if (lowerText.includes("склад")) formattedWarehouseNumber = `СКЛАД ${warehouseNumber}`;
    else if (lowerText.includes("пункт")) formattedWarehouseNumber = `ПУНКТ ${warehouseNumber}`;

    // street
    const street = selectedText.split(":")[1]?.trim() || warehouse.ShortAddress || "";

    const result = {
      city: cityData?.Description || "",
      region: cityData?.AreaDescription || "",
      district: districtInput?.value || "",
      warehouse: selectedText,
      street,
      warehouseNumber: formattedWarehouseNumber,
      warehouseType: type
    };

    // sync hidden (+ тригеримо 'input' → submit-all.js збереже драфт)
    setHiddenAndNotify("hidden-city", result.city);
    setHiddenAndNotify("hidden-region", result.region);
    setHiddenAndNotify("hidden-district", result.district);
    setHiddenAndNotify("hidden-warehouse", result.warehouse);
    setHiddenAndNotify("hidden-street", result.street);
    setHiddenAndNotify("hidden-warehouse-number", result.warehouseNumber);
    setHiddenAndNotify("hidden-warehouse-type", result.warehouseType);

    if (typeof callback === "function") callback(result);
  }

  // === 🔄 АВТОВІДНОВЛЕННЯ З ДРАФТУ ===
  (async function restoreFromDraftIntoWidget() {
    const d = readDraft();
    if (!d || !d.city) return;                 // нема що відновлювати

    // 1) заповнюємо видимі поля міста/області/району
    input.value = d.city;
    regionDisplay.value = d.region || "";
    districtInput.value = d.district || "";

    // 2) знаходимо реф міста і підтягуємо склади
    try {
      const res = await fetch('/.netlify/functions/shipping-directory?'+new URLSearchParams({kind:'cities',q:d.city}));
      const js = await res.json();
      if(!res.ok) throw new Error(js.error || 'NP_DIRECTORY_UNAVAILABLE_01543');
      const list=(js.items||[]).map(c=>({Ref:c.ref,Description:c.name,AreaDescription:c.region}));
      // беремо точний збіг по назві, або перший
      cityData = list.find(c => c.Description === d.city) || list[0];
      if (!cityData) return;

      // одразу синхронізуємо hidden значення міста/області
      setHiddenAndNotify("hidden-city", cityData.Description);
      setHiddenAndNotify("hidden-region", cityData.AreaDescription);
      setHiddenAndNotify("hidden-district", districtInput.value);

      // 3) підтягуємо склади і ставимо той, що в драфті
      await loadWarehouses(cityData.Ref, d.warehouse || null);
    } catch (e) {
      console.warn("⚠️ Не вдалося відновити адресу з драфту:", e);
    }
  })();
}
