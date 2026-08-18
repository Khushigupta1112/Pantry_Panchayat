import { useState, useEffect } from "react";
import {
  ChefHat,
  Package,
  ShoppingBag,
  History as HistoryIcon,
  Plus,
  Trash2,
  Shuffle,
  Sparkles,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";

const UNITS = ["g", "kg", "ml", "l", "pcs", "packs"];
const CATEGORIES = [
  "Grains & Staples",
  "Vegetables",
  "Fruits",
  "Dairy & Eggs",
  "Proteins",
  "Spices & Condiments",
  "Others",
];
const STORAGE_KEY = "pantry-panchayat-data";

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export default function PantryPanchayat() {
  const [loaded, setLoaded] = useState(false);
  const [roommates, setRoommates] = useState(["Aman", "Rehan"]);
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [shoppingExtras, setShoppingExtras] = useState([]);
  const [tab, setTab] = useState("pantry");
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({ name: "", quantity: "", unit: "g", category: "Vegetables", reorderLevel: "" });

  const [mealType, setMealType] = useState("Dinner");
  const [prefText, setPrefText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [confirmIndex, setConfirmIndex] = useState(null);
  const [confirmCook, setConfirmCook] = useState("Aman");

  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);

  const [extraInput, setExtraInput] = useState("");
  const [restockInputs, setRestockInputs] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, true);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setRoommates(parsed.roommates || ["Aman", "Rehan"]);
          setInventory(parsed.inventory || []);
          setHistory(parsed.history || []);
          setShoppingExtras(parsed.shoppingExtras || []);
        }
      } catch (e) {
        // no data saved yet — that's fine, start fresh
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set(
          STORAGE_KEY,
          JSON.stringify({ roommates, inventory, history, shoppingExtras }),
          true
        );
      } catch (e) {
        console.error("save failed", e);
      }
    })();
  }, [roommates, inventory, history, shoppingExtras, loaded]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const lowStock = inventory.filter((i) => Number(i.quantity) <= Number(i.reorderLevel));
  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: inventory.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  function addItem(e) {
    e.preventDefault();
    if (!form.name.trim() || form.quantity === "") return;
    setInventory((prev) => [
      ...prev,
      {
        id: uid(),
        name: form.name.trim(),
        quantity: Number(form.quantity),
        unit: form.unit,
        category: form.category,
        reorderLevel: form.reorderLevel === "" ? 0 : Number(form.reorderLevel),
      },
    ]);
    setForm({ name: "", quantity: "", unit: "g", category: "Vegetables", reorderLevel: "" });
  }

  function deleteItem(id) {
    setInventory((prev) => prev.filter((i) => i.id !== id));
  }

  function nudgeQty(id, delta) {
    setInventory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, +(i.quantity + delta).toFixed(2)) } : i))
    );
  }

  function loadDemoPantry() {
    setInventory([
      { id: uid(), name: "Rice", category: "Grains & Staples", quantity: 3, unit: "kg", reorderLevel: 1 },
      { id: uid(), name: "Wheat Atta", category: "Grains & Staples", quantity: 2, unit: "kg", reorderLevel: 1 },
      { id: uid(), name: "Toor Dal", category: "Grains & Staples", quantity: 500, unit: "g", reorderLevel: 200 },
      { id: uid(), name: "Onion", category: "Vegetables", quantity: 6, unit: "pcs", reorderLevel: 3 },
      { id: uid(), name: "Tomato", category: "Vegetables", quantity: 4, unit: "pcs", reorderLevel: 3 },
      { id: uid(), name: "Potato", category: "Vegetables", quantity: 5, unit: "pcs", reorderLevel: 2 },
      { id: uid(), name: "Paneer", category: "Dairy & Eggs", quantity: 200, unit: "g", reorderLevel: 100 },
      { id: uid(), name: "Eggs", category: "Dairy & Eggs", quantity: 6, unit: "pcs", reorderLevel: 4 },
      { id: uid(), name: "Milk", category: "Dairy & Eggs", quantity: 500, unit: "ml", reorderLevel: 250 },
      { id: uid(), name: "Cooking Oil", category: "Spices & Condiments", quantity: 1, unit: "l", reorderLevel: 0.5 },
      { id: uid(), name: "Turmeric Powder", category: "Spices & Condiments", quantity: 50, unit: "g", reorderLevel: 20 },
      { id: uid(), name: "Salt", category: "Spices & Condiments", quantity: 300, unit: "g", reorderLevel: 50 },
    ]);
function generateLocalFallbackVerdicts(inventory = [], mealType = "Dinner", prefText = "") {
  const findItem = (sub) => inventory.find((i) => i.name.toLowerCase().includes(sub.toLowerCase()));

  const rice = findItem("rice");
  const atta = findItem("atta") || findItem("wheat");
  const dal = findItem("dal") || findItem("toor");
  const onion = findItem("onion");
  const tomato = findItem("tomato");
  const potato = findItem("potato");
  const paneer = findItem("paneer");
  const egg = findItem("egg");
  const oil = findItem("oil");

  const dishes = [];

  if (dal || rice) {
    dishes.push({
      name: "Classic Dal Khichdi & Salad",
      cuisine: "North Indian Comfort",
      timeMinutes: 25,
      description: "The supreme council approves khichdi: simple, comforting, and saves half your pantry.",
      ingredientsUsed: [
        ...(dal ? [{ name: dal.name, qty: Math.min(100, dal.quantity), unit: dal.unit }] : []),
        ...(rice ? [{ name: rice.name, qty: Math.min(150, rice.quantity), unit: rice.unit }] : []),
        ...(onion ? [{ name: onion.name, qty: 1, unit: onion.unit }] : []),
      ],
      extraNeeded: ["Cumin seeds", "Ghee (optional)"],
    });
  }

  if (egg) {
    dishes.push({
      name: "Desi Masala Egg Bhurji",
      cuisine: "Street Food",
      timeMinutes: 15,
      description: "Quick, spicy, protein-packed. The council orders extra onions for crunch.",
      ingredientsUsed: [
        { name: egg.name, qty: Math.min(3, egg.quantity), unit: egg.unit },
        ...(onion ? [{ name: onion.name, qty: 1, unit: onion.unit }] : []),
        ...(tomato ? [{ name: tomato.name, qty: 1, unit: tomato.unit }] : []),
      ],
      extraNeeded: ["Green chillies", "Coriander"],
    });
  }

  if (paneer) {
    dishes.push({
      name: "Quick Homestyle Paneer Bhurji",
      cuisine: "North Indian",
      timeMinutes: 20,
      description: "Rich and quick. The Panchayat declares paneer duty a privilege, not a chore.",
      ingredientsUsed: [
        { name: paneer.name, qty: Math.min(150, paneer.quantity), unit: paneer.unit },
        ...(onion ? [{ name: onion.name, qty: 1, unit: onion.unit }] : []),
        ...(tomato ? [{ name: tomato.name, qty: 1, unit: tomato.unit }] : []),
      ],
      extraNeeded: ["Garam masala"],
    });
  }

  if (potato) {
    dishes.push({
      name: "Jeera Aloo Fry",
      cuisine: "Indian Home",
      timeMinutes: 18,
      description: "Crispy potatoes in basic spices. Zero drama, 100% satisfaction.",
      ingredientsUsed: [
        { name: potato.name, qty: Math.min(3, potato.quantity), unit: potato.unit },
        ...(oil ? [{ name: oil.name, qty: Math.min(0.02, oil.quantity), unit: oil.unit }] : []),
      ],
      extraNeeded: ["Cumin seeds", "Red chilli powder"],
    });
  }

  if (atta) {
    dishes.push({
      name: "Fresh Phulkas with Aloo Subzi",
      cuisine: "Indian Staples",
      timeMinutes: 30,
      description: "Classic roommate fuel. Roll rotis together to avoid dishes drama.",
      ingredientsUsed: [
        { name: atta.name, qty: Math.min(200, atta.quantity), unit: atta.unit },
        ...(potato ? [{ name: potato.name, qty: Math.min(2, potato.quantity), unit: potato.unit }] : []),
      ],
      extraNeeded: ["Water for dough"],
    });
  }

  while (dishes.length < 3) {
    const item1 = inventory[dishes.length % Math.max(1, inventory.length)] || { name: "Pantry item", quantity: 1, unit: "pcs" };
    dishes.push({
      name: `Special ${item1.name} Verdict`,
      cuisine: "Roommate Fusion",
      timeMinutes: 20,
      description: "Creative kitchen experiment approved by the Panchayat council.",
      ingredientsUsed: [{ name: item1.name, qty: Math.min(1, item1.quantity || 1), unit: item1.unit || "pcs" }],
      extraNeeded: ["Basic spices"],
    });
  }

  return dishes.slice(0, 3);
}

  function loadDemoPantry() {
    setInventory([
      { id: uid(), name: "Rice", category: "Grains & Staples", quantity: 3, unit: "kg", reorderLevel: 1 },
      { id: uid(), name: "Wheat Atta", category: "Grains & Staples", quantity: 2, unit: "kg", reorderLevel: 1 },
      { id: uid(), name: "Toor Dal", category: "Grains & Staples", quantity: 500, unit: "g", reorderLevel: 200 },
      { id: uid(), name: "Onion", category: "Vegetables", quantity: 6, unit: "pcs", reorderLevel: 3 },
      { id: uid(), name: "Tomato", category: "Vegetables", quantity: 4, unit: "pcs", reorderLevel: 3 },
      { id: uid(), name: "Potato", category: "Vegetables", quantity: 5, unit: "pcs", reorderLevel: 2 },
      { id: uid(), name: "Paneer", category: "Dairy & Eggs", quantity: 200, unit: "g", reorderLevel: 100 },
      { id: uid(), name: "Eggs", category: "Dairy & Eggs", quantity: 6, unit: "pcs", reorderLevel: 4 },
      { id: uid(), name: "Milk", category: "Dairy & Eggs", quantity: 500, unit: "ml", reorderLevel: 250 },
      { id: uid(), name: "Cooking Oil", category: "Spices & Condiments", quantity: 1, unit: "l", reorderLevel: 0.5 },
      { id: uid(), name: "Turmeric Powder", category: "Spices & Condiments", quantity: 50, unit: "g", reorderLevel: 20 },
      { id: uid(), name: "Salt", category: "Spices & Condiments", quantity: 300, unit: "g", reorderLevel: 50 },
    ]);
  }

  async function askPanchayat() {
    if (inventory.length === 0) {
      loadDemoPantry();
    }
    setAiLoading(true);
    setAiError(null);
    setSuggestions(null);
    setConfirmIndex(null);
    try {
      const activeInventory = inventory.length > 0 ? inventory : [
        { name: "Rice", quantity: 3, unit: "kg" },
        { name: "Toor Dal", quantity: 500, unit: "g" },
        { name: "Onion", quantity: 6, unit: "pcs" },
      ];
      const list = activeInventory.map((i) => `${i.name}: ${i.quantity}${i.unit}`).join(", ");
      const system = `You are the "Pantry Panchayat", a witty but practical food-decision council for roommates sharing a kitchen in India. Given their pantry inventory, propose exactly 3 different dishes they could cook using mainly what they already have. Respond with ONLY a raw JSON array - no markdown fences, no commentary, nothing before or after it. Each element must match this shape exactly: {"name": string, "cuisine": string, "timeMinutes": number, "description": string (max 20 words, witty judge-like tone), "ingredientsUsed": [{"name": string, "qty": number, "unit": string}], "extraNeeded": [string]}. For ingredientsUsed, use item names EXACTLY as given in the pantry list, with the same unit, and realistic quantities. Anything the dish needs that is not in the pantry goes into extraNeeded as a short string instead, not into ingredientsUsed. Prefer dishes that need little or nothing extra.`;
      const userMsg = `Pantry inventory:\n${list}\n\nMeal type: ${mealType}\nPreferences: ${
        prefText.trim() || "none"
      }\n\nDeliver 3 verdicts now.`;
      
      const response = await fetch("/api/panchayat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          system,
          messages: [{ role: "user", content: userMsg }],
        }),
      }).catch(() => null);

      if (!response || !response.ok) {
        const fallback = generateLocalFallbackVerdicts(activeInventory, mealType, prefText);
        setSuggestions(fallback);
        return;
      }

      const data = await response.json().catch(() => ({}));
      const text = (data.content || []).map((b) => b.text || "").join("");
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("bad shape");
      setSuggestions(parsed);
    } catch (e) {
      const fallback = generateLocalFallbackVerdicts(inventory, mealType, prefText);
      setSuggestions(fallback);
    } finally {
      setAiLoading(false);
    }
  }

  function confirmCooked(dish) {
    setInventory((prev) =>
      prev.map((item) => {
        const used = dish.ingredientsUsed.find((u) => u.name.toLowerCase() === item.name.toLowerCase());
        if (!used) return item;
        return { ...item, quantity: Math.max(0, +(item.quantity - Number(used.qty)).toFixed(2)) };
      })
    );
    setHistory((prev) => [
      {
        id: uid(),
        date: new Date().toISOString(),
        dishName: dish.name,
        cuisine: dish.cuisine,
        cookedBy: confirmCook,
        ingredientsUsed: dish.ingredientsUsed,
      },
      ...prev,
    ]);
    setSuggestions(null);
    setConfirmIndex(null);
    setToast(`Verdict logged: "${dish.name}" cooked by ${confirmCook}. Pantry updated.`);
  }

  function spinCookTurn() {
    setSpinning(true);
    setSpinResult(null);
    setTimeout(() => {
      setSpinResult(roommates[Math.floor(Math.random() * roommates.length)]);
      setSpinning(false);
    }, 650);
  }

  function restockItem(id) {
    const addQty = Number(restockInputs[id]);
    if (!addQty) return;
    setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: +(i.quantity + addQty).toFixed(2) } : i)));
    setRestockInputs((prev) => ({ ...prev, [id]: "" }));
    setToast("Restocked. Pantry updated.");
  }

  function addExtra(e) {
    e.preventDefault();
    if (!extraInput.trim()) return;
    setShoppingExtras((prev) => [...prev, { id: uid(), name: extraInput.trim(), done: false }]);
    setExtraInput("");
  }

  function toggleExtra(id) {
    setShoppingExtras((prev) => prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  }

  function removeExtra(id) {
    setShoppingExtras((prev) => prev.filter((x) => x.id !== id));
  }

  const mealsThisWeek = history.filter((h) => Date.now() - new Date(h.date).getTime() < 7 * 24 * 3600 * 1000).length;

  const TABS = [
    { id: "pantry", label: "Pantry", icon: Package },
    { id: "cook", label: "Cook Today", icon: ChefHat },
    { id: "restock", label: "Restock", icon: ShoppingBag },
    { id: "history", label: "History", icon: HistoryIcon },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
        .font-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.02em; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        .stamp { border: 3px solid currentColor; border-radius: 9999px; transform: rotate(-8deg); }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <ChefHat className="w-8 h-8 text-amber-400" />
            <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-amber-400">Pantry Panchayat</h1>
          </div>
          <p className="text-stone-400 text-sm sm:text-base mb-4">Let the pantry decide, not the fight.</p>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-full px-3 py-1.5">
              <span className="text-stone-500">Council:</span>
              {roommates.map((name, idx) => (
                <input
                  key={idx}
                  value={name}
                  onChange={(e) => setRoommates((prev) => prev.map((n, i) => (i === idx ? e.target.value : n)))}
                  className="bg-transparent border-b border-stone-700 focus:border-amber-400 outline-none w-24 text-stone-100"
                />
              ))}
            </div>
            <div className="bg-stone-900 border border-stone-800 rounded-full px-3 py-1.5">
              <span className="text-stone-500">Items tracked:</span>{" "}
              <span className="font-mono text-stone-100">{inventory.length}</span>
            </div>
            <div
              className={`rounded-full px-3 py-1.5 border ${
                lowStock.length ? "bg-red-950 border-red-800 text-red-300" : "bg-stone-900 border-stone-800 text-stone-300"
              }`}
            >
              <span className="opacity-70">Low stock:</span> <span className="font-mono">{lowStock.length}</span>
            </div>
            <div className="bg-stone-900 border border-stone-800 rounded-full px-3 py-1.5">
              <span className="text-stone-500">Meals this week:</span>{" "}
              <span className="font-mono text-stone-100">{mealsThisWeek}</span>
            </div>
          </div>
        </header>

        <div className="flex gap-1 flex-wrap">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors ${
                  active ? "bg-stone-50 text-stone-900" : "bg-stone-900 text-stone-400 hover:text-stone-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.id === "restock" && lowStock.length > 0 && (
                  <span className="ml-1 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {lowStock.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-stone-50 text-stone-900 rounded-b-xl rounded-tr-xl p-5 sm:p-7 min-h-[420px]">
          {tab === "pantry" && (
            <PantryTab
              form={form}
              setForm={setForm}
              addItem={addItem}
              grouped={grouped}
              lowStock={lowStock}
              nudgeQty={nudgeQty}
              deleteItem={deleteItem}
              inventory={inventory}
              loadDemoPantry={loadDemoPantry}
            />
          )}
          {tab === "cook" && (
            <CookTab
              mealType={mealType}
              setMealType={setMealType}
              prefText={prefText}
              setPrefText={setPrefText}
              aiLoading={aiLoading}
              aiError={aiError}
              suggestions={suggestions}
              askPanchayat={askPanchayat}
              inventory={inventory}
              confirmIndex={confirmIndex}
              setConfirmIndex={setConfirmIndex}
              confirmCook={confirmCook}
              setConfirmCook={setConfirmCook}
              confirmCooked={confirmCooked}
              roommates={roommates}
              spinning={spinning}
              spinResult={spinResult}
              spinCookTurn={spinCookTurn}
            />
          )}
          {tab === "restock" && (
            <RestockTab
              lowStock={lowStock}
              restockInputs={restockInputs}
              setRestockInputs={setRestockInputs}
              restockItem={restockItem}
              shoppingExtras={shoppingExtras}
              extraInput={extraInput}
              setExtraInput={setExtraInput}
              addExtra={addExtra}
              toggleExtra={toggleExtra}
              removeExtra={removeExtra}
            />
          )}
          {tab === "history" && <HistoryTab history={history} />}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-50 text-stone-900 px-4 py-3 rounded-lg shadow-xl border border-stone-200 flex items-center gap-2 text-sm max-w-md">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}

function PantryTab({ form, setForm, addItem, grouped, lowStock, nudgeQty, deleteItem, inventory, loadDemoPantry }) {
  return (
    <div>
      <form onSubmit={addItem} className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-6">
        <input
          placeholder="Item name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="col-span-2 border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <input
          placeholder="Qty"
          type="number"
          step="any"
          value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
          className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <select
          value={form.unit}
          onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          className="border border-stone-300 rounded-md px-2 py-2 text-sm"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="border border-stone-300 rounded-md px-2 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          placeholder="Reorder at"
          type="number"
          step="any"
          value={form.reorderLevel}
          onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))}
          className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          className="col-span-2 sm:col-span-6 sm:w-auto sm:justify-self-start flex items-center justify-center gap-1.5 bg-stone-900 text-stone-50 rounded-md px-4 py-2 text-sm font-medium hover:bg-stone-800"
        >
          <Plus className="w-4 h-4" /> Add to pantry
        </button>
      </form>

      {inventory.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-stone-300 rounded-lg">
          <p className="text-stone-500 mb-4">Your pantry's empty. Add what's actually in your kitchen, or start from a sample.</p>
          <button
            onClick={loadDemoPantry}
            className="bg-amber-500 text-stone-900 rounded-md px-4 py-2 text-sm font-semibold hover:bg-amber-400"
          >
            Load demo pantry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.category}>
              <h3 className="font-display text-lg tracking-wide text-stone-500 mb-2">{g.category}</h3>
              <div className="space-y-1.5">
                {g.items.map((item) => {
                  const isLow = lowStock.some((l) => l.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 border ${
                        isLow ? "bg-red-50 border-red-200" : "bg-white border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium truncate">{item.name}</span>
                        {isLow && (
                          <span className="text-[10px] uppercase font-semibold bg-red-600 text-white rounded px-1.5 py-0.5 shrink-0">
                            Low
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => nudgeQty(item.id, -1)} className="w-6 h-6 rounded bg-stone-200 hover:bg-stone-300 text-sm">
                          -
                        </button>
                        <span className="font-mono text-sm w-20 text-right">
                          {item.quantity}
                          {item.unit}
                        </span>
                        <button onClick={() => nudgeQty(item.id, 1)} className="w-6 h-6 rounded bg-stone-200 hover:bg-stone-300 text-sm">
                          +
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="text-stone-400 hover:text-red-600 ml-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CookTab({
  mealType,
  setMealType,
  prefText,
  setPrefText,
  aiLoading,
  aiError,
  suggestions,
  askPanchayat,
  inventory,
  confirmIndex,
  setConfirmIndex,
  confirmCook,
  setConfirmCook,
  confirmCooked,
  roommates,
  spinning,
  spinResult,
  spinCookTurn,
}) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-3">
        <div>
          <label className="block text-xs text-stone-500 mb-1">Meal</label>
          <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="border border-stone-300 rounded-md px-3 py-2 text-sm">
            {["Breakfast", "Lunch", "Dinner", "Snack"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-stone-500 mb-1">Preferences (optional)</label>
          <input
            value={prefText}
            onChange={(e) => setPrefText(e.target.value)}
            placeholder="e.g. quick, no onion, something spicy"
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={askPanchayat}
          disabled={aiLoading}
          type="button"
          className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 rounded-md px-4 py-2 text-sm font-semibold whitespace-nowrap cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          {aiLoading ? "Deliberating…" : "Ask the Panchayat"}
        </button>
      </div>

      {inventory.length === 0 && (
        <p className="text-sm text-stone-500 mb-4">Add pantry items first so the panchayat has something to work with.</p>
      )}
      {aiError && (
        <p className="text-sm text-red-600 mb-4 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          {aiError}
        </p>
      )}

      {suggestions && (
        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          {suggestions.map((dish, idx) => (
            <div key={idx} className="relative border border-stone-200 rounded-lg p-4 bg-white flex flex-col">
              <span className="stamp absolute -top-3 -right-3 bg-white text-red-600 text-[9px] font-bold uppercase px-2 py-1 leading-tight">
                Verdict
              </span>
              <h4 className="font-display text-2xl tracking-wide mb-0.5">{dish.name}</h4>
              <p className="text-xs text-stone-500 mb-2">
                {dish.cuisine} · {dish.timeMinutes} min
              </p>
              <p className="text-sm text-stone-700 mb-3">{dish.description}</p>
              <div className="text-xs text-stone-600 mb-2 space-y-0.5">
                {dish.ingredientsUsed.map((u, i) => (
                  <div key={i} className="flex justify-between font-mono">
                    <span className="font-sans">{u.name}</span>
                    <span>
                      {u.qty}
                      {u.unit}
                    </span>
                  </div>
                ))}
              </div>
              {dish.extraNeeded && dish.extraNeeded.length > 0 && (
                <p className="text-xs text-amber-700 mb-3">Need to buy: {dish.extraNeeded.join(", ")}</p>
              )}
              <div className="mt-auto pt-2">
                {confirmIndex === idx ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={confirmCook}
                      onChange={(e) => setConfirmCook(e.target.value)}
                      className="border border-stone-300 rounded-md px-2 py-1.5 text-xs flex-1"
                    >
                      {roommates.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => confirmCooked(dish)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-md px-3 py-1.5 text-xs font-semibold"
                    >
                      Confirm
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setConfirmIndex(idx);
                      setConfirmCook(roommates[0]);
                    }}
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-md px-3 py-2 text-xs font-semibold"
                  >
                    Cook this
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-stone-200 flex items-center gap-4 flex-wrap">
        <button onClick={spinCookTurn} className="flex items-center gap-1.5 bg-stone-200 hover:bg-stone-300 rounded-md px-3 py-2 text-sm font-medium">
          <Shuffle className="w-4 h-4" /> Whose turn to cook?
        </button>
        {spinning && <span className="text-sm text-stone-500">deciding…</span>}
        {!spinning && spinResult && <span className="text-sm font-semibold text-stone-800">{spinResult} is cooking today.</span>}
      </div>
    </div>
  );
}

function RestockTab({
  lowStock,
  restockInputs,
  setRestockInputs,
  restockItem,
  shoppingExtras,
  extraInput,
  setExtraInput,
  addExtra,
  toggleExtra,
  removeExtra,
}) {
  return (
    <div>
      <h3 className="font-display text-lg tracking-wide text-stone-500 mb-2">Running low</h3>
      {lowStock.length === 0 ? (
        <p className="text-sm text-stone-500 mb-6">Nothing's below its reorder line right now.</p>
      ) : (
        <div className="space-y-1.5 mb-8">
          {lowStock.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 bg-red-50 border border-red-200 rounded-md px-3 py-2 flex-wrap">
              <div>
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-stone-500 ml-2 font-mono">
                  {item.quantity}
                  {item.unit} left · reorder at {item.reorderLevel}
                  {item.unit}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="add qty"
                  value={restockInputs[item.id] || ""}
                  onChange={(e) => setRestockInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  className="w-20 border border-stone-300 rounded-md px-2 py-1 text-xs"
                />
                <button onClick={() => restockItem(item.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-md px-3 py-1.5 text-xs font-semibold">
                  Restock
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="font-display text-lg tracking-wide text-stone-500 mb-2">Shopping list extras</h3>
      <form onSubmit={addExtra} className="flex gap-2 mb-3">
        <input
          value={extraInput}
          onChange={(e) => setExtraInput(e.target.value)}
          placeholder="e.g. curd, coriander"
          className="flex-1 border border-stone-300 rounded-md px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-stone-900 hover:bg-stone-800 text-white rounded-md px-3 py-2 text-sm font-medium">
          Add
        </button>
      </form>
      <div className="space-y-1">
        {shoppingExtras.map((x) => (
          <div key={x.id} className="flex items-center justify-between px-3 py-2 border border-stone-200 rounded-md bg-white">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={x.done} onChange={() => toggleExtra(x.id)} />
              <span className={x.done ? "line-through text-stone-400" : ""}>{x.name}</span>
            </label>
            <button onClick={() => removeExtra(x.id)} className="text-stone-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTab({ history }) {
  if (history.length === 0) {
    return <p className="text-sm text-stone-500">No meals logged yet. Cook something and confirm it from the "Cook Today" tab.</p>;
  }
  const counts = {};
  history.forEach((h) => {
    counts[h.dishName] = (counts[h.dishName] || 0) + 1;
  });
  const favorite = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div>
      <p className="text-sm text-stone-600 mb-4">
        {history.length} meals logged · most repeated: <span className="font-semibold">{favorite[0]}</span> ({favorite[1]}×)
      </p>
      <div className="space-y-2">
        {history.map((h) => (
          <div key={h.id} className="border border-stone-200 rounded-md px-3 py-2.5 bg-white">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold">{h.dishName}</span>
              <span className="text-xs text-stone-400">
                {new Date(h.date).toLocaleDateString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              {h.cuisine} · cooked by {h.cookedBy}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
