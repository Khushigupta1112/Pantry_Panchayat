import { useState, useEffect, useCallback } from "react";
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
  Flame,
  PartyPopper,
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

const CATEGORY_EMOJI = {
  "Grains & Staples": "🌾",
  Vegetables: "🥬",
  Fruits: "🍎",
  "Dairy & Eggs": "🥛",
  Proteins: "🍗",
  "Spices & Condiments": "🌶️",
  Others: "📦",
};

const ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022";

const FUNNY_TAGLINES = [
  "Let the pantry decide, not the fight.",
  "Where dal meets democracy.",
  "Three roommates. One onion. Infinite drama.",
  "Your fridge has opinions. We have verdicts.",
  "No more 'kya banayein?' at 9 PM.",
  "The council has spoken. It's probably khichdi again.",
];

const ADD_TOASTS = [
  "Council approved. Item logged.",
  "Added! Your future self says thanks.",
  "Pantry updated. One less 'do we have this?' moment.",
  "Verdict: yes, we have it now. Officially.",
  "Item secured. The onion can rest easy.",
];

const SPIN_MESSAGES = [
  "is cooking today. May the stove be with them.",
  "draws the short ladle. Good luck, chef!",
  "has been chosen by the cosmic tava.",
  "must face the kitchen. Send help (and snacks).",
  "won the cook lottery. Paneer duty awaits.",
];

const STORAGE_KEY = "pantry-panchayat-data";

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

async function loadData() {
  try {
    if (typeof window !== "undefined" && window.storage?.get) {
      const res = await window.storage.get(STORAGE_KEY, true);
      if (res?.value) return JSON.parse(res.value);
    }
  } catch {
    /* fall through to localStorage */
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* start fresh */
  }
  return null;
}

async function saveData(payload) {
  const json = JSON.stringify(payload);
  try {
    if (typeof window !== "undefined" && window.storage?.set) {
      await window.storage.set(STORAGE_KEY, json, true);
      return;
    }
  } catch {
    /* fall through */
  }
  localStorage.setItem(STORAGE_KEY, json);
}

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

export default function PantryPanchayat() {
  const [loaded, setLoaded] = useState(false);
  const [roommates, setRoommates] = useState(["Aman", "Rehan"]);
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [shoppingExtras, setShoppingExtras] = useState([]);
  const [tab, setTab] = useState("pantry");
  const [toast, setToast] = useState(null);
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  const [form, setForm] = useState({ name: "", quantity: "", unit: "g", category: "Vegetables", reorderLevel: "" });
  const [formError, setFormError] = useState("");

  const [mealType, setMealType] = useState("Dinner");
  const [prefText, setPrefText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [confirmIndex, setConfirmIndex] = useState(null);
  const [confirmCook, setConfirmCook] = useState("Aman");

  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [spinMsg, setSpinMsg] = useState("");

  const [extraInput, setExtraInput] = useState("");
  const [restockInputs, setRestockInputs] = useState({});

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const parsed = await loadData();
      if (cancelled) return;
      if (parsed) {
        setRoommates(parsed.roommates || ["Aman", "Rehan"]);
        setInventory(parsed.inventory || []);
        setHistory(parsed.history || []);
        setShoppingExtras(parsed.shoppingExtras || []);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveData({ roommates, inventory, history, shoppingExtras }).catch((e) => console.error("save failed", e));
  }, [roommates, inventory, history, shoppingExtras, loaded]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const t = setInterval(() => setTaglineIdx((i) => (i + 1) % FUNNY_TAGLINES.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!celebrate) return;
    const t = setTimeout(() => setCelebrate(false), 700);
    return () => clearTimeout(t);
  }, [celebrate]);

  const lowStock = inventory.filter((i) => Number(i.quantity) <= Number(i.reorderLevel));
  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: inventory.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  function addItem(e) {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Give it a name — even 'mystery masala' counts.");
      return;
    }
    if (form.quantity === "" || Number.isNaN(Number(form.quantity))) {
      setFormError("How much? The council needs numbers, not vibes.");
      return;
    }
    if (Number(form.quantity) < 0) {
      setFormError("Negative quantities? We're tracking pantry, not debt.");
      return;
    }

    const newItem = {
      id: uid(),
      name: form.name.trim(),
      quantity: Number(form.quantity),
      unit: form.unit,
      category: form.category,
      reorderLevel: form.reorderLevel === "" ? 0 : Number(form.reorderLevel),
    };

    setInventory((prev) => [...prev, newItem]);
    setForm({ name: "", quantity: "", unit: "g", category: form.category, reorderLevel: "" });
    setCelebrate(true);
    showToast(ADD_TOASTS[Math.floor(Math.random() * ADD_TOASTS.length)]);
  }

  function deleteItem(id) {
    setInventory((prev) => prev.filter((i) => i.id !== id));
    showToast("Item removed. Gone but not forgotten.", "info");
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
    setCelebrate(true);
    showToast("Demo pantry loaded. Your kitchen is now officially overstocked with drama.");
  }

  async function askPanchayat() {
    if (inventory.length === 0) {
      showToast("Pantry is empty! Loading demo items so the council can deliver verdicts.", "info");
      loadDemoPantry();
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setSuggestions(null);
    setConfirmIndex(null);
    try {
      const list = inventory.map((i) => `${i.name}: ${i.quantity}${i.unit}`).join(", ");
      const system = `You are the "Pantry Panchayat", a witty but practical food-decision council for roommates sharing a kitchen in India. Given their pantry inventory, propose exactly 3 different dishes they could cook using mainly what they already have. Respond with ONLY a raw JSON array - no markdown fences, no commentary, nothing before or after it. Each element must match this shape exactly: {"name": string, "cuisine": string, "timeMinutes": number, "description": string (max 20 words, witty judge-like tone), "ingredientsUsed": [{"name": string, "qty": number, "unit": string}], "extraNeeded": [string]}. For ingredientsUsed, use item names EXACTLY as given in the pantry list, with the same unit, and realistic quantities. Anything the dish needs that is not in the pantry goes into extraNeeded as a short string instead, not into ingredientsUsed. Prefer dishes that need little or nothing extra.`;
      const userMsg = `Pantry inventory:\n${list}\n\nMeal type: ${mealType}\nPreferences: ${
        prefText.trim() || "none"
      }\n\nDeliver 3 verdicts now.`;
      const response = await fetch("/api/panchayat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 1000,
          system,
          messages: [{ role: "user", content: userMsg }],
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errObj = data?.error;
        const message =
          (typeof errObj === "string" ? errObj : errObj?.message) ||
          data?.message ||
          "The panchayat couldn't reach a verdict just now.";

        if (errObj?.isMissingKey || response.status === 400 || response.status === 401) {
          console.warn("Anthropic API key issue, switching to local verdict generator:", message);
          const fallback = generateLocalFallbackVerdicts(inventory, mealType, prefText);
          setSuggestions(fallback);
          showToast("Using local Panchayat Verdict Generator (Set ANTHROPIC_API_KEY in .env.local for Claude AI)", "info");
          return;
        }
        throw new Error(message);
      }

      const text = (data.content || []).map((b) => b.text || "").join("");
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("The model returned an empty verdict set.");
      setSuggestions(parsed);
    } catch (error) {
      console.error("panchayat request failed", error);
      const fallback = generateLocalFallbackVerdicts(inventory, mealType, prefText);
      setSuggestions(fallback);
      setAiError(error?.message || "Using local Panchayat verdict generator.");
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
    setCelebrate(true);
    showToast(`Verdict logged: "${dish.name}" cooked by ${confirmCook}. Pantry updated.`);
  }

  function spinCookTurn() {
    setSpinning(true);
    setSpinResult(null);
    setSpinMsg("");
    setTimeout(() => {
      const winner = roommates[Math.floor(Math.random() * roommates.length)];
      setSpinResult(winner);
      setSpinMsg(SPIN_MESSAGES[Math.floor(Math.random() * SPIN_MESSAGES.length)]);
      setSpinning(false);
    }, 1200);
  }

  function restockItem(id) {
    const addQty = Number(restockInputs[id]);
    if (!addQty) return;
    setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: +(i.quantity + addQty).toFixed(2) } : i)));
    setRestockInputs((prev) => ({ ...prev, [id]: "" }));
    showToast("Restocked. The council is pleased.");
  }

  function addExtra(e) {
    e.preventDefault();
    if (!extraInput.trim()) return;
    setShoppingExtras((prev) => [...prev, { id: uid(), name: extraInput.trim(), done: false }]);
    setExtraInput("");
    showToast("Added to shopping list. Don't forget the dhaniya this time.");
  }

  function toggleExtra(id) {
    setShoppingExtras((prev) => prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  }

  function removeExtra(id) {
    setShoppingExtras((prev) => prev.filter((x) => x.id !== id));
  }

  const mealsThisWeek = history.filter((h) => Date.now() - new Date(h.date).getTime() < 7 * 24 * 3600 * 1000).length;

  const TABS = [
    { id: "pantry", label: "Pantry", icon: Package, emoji: "🏠" },
    { id: "cook", label: "Cook Today", icon: ChefHat, emoji: "👨‍🍳" },
    { id: "restock", label: "Restock", icon: ShoppingBag, emoji: "🛒" },
    { id: "history", label: "History", icon: HistoryIcon, emoji: "📜" },
  ];

  if (!loaded) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <ChefHat className="w-12 h-12 text-amber-400 mx-auto mb-3 animate-float" />
          <p className="text-stone-400 font-display text-xl tracking-wide">Summoning the council…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans relative overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
        .font-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.02em; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        .stamp { border: 3px solid currentColor; border-radius: 9999px; transform: rotate(-8deg); animation: stampIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes stampIn { from { transform: rotate(-8deg) scale(2); opacity: 0; } to { transform: rotate(-8deg) scale(1); opacity: 1; } }
        .bg-mesh { background: radial-gradient(ellipse at 20% 0%, rgba(251,191,36,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(239,68,68,0.08) 0%, transparent 50%), #0c0a09; }
        .tab-content-enter { animation: tabEnter 0.35s ease-out forwards; }
        @keyframes tabEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .item-enter { animation: itemEnter 0.4s ease-out forwards; opacity: 0; }
        @keyframes itemEnter { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      {/* Floating background emojis */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.04]">
        {["🍳", "🧅", "🍚", "🫓", "🥘", "🌶️"].map((e, i) => (
          <span
            key={i}
            className="absolute text-6xl animate-float"
            style={{ left: `${10 + i * 15}%`, top: `${15 + (i % 3) * 25}%`, animationDelay: `${i * 0.5}s` }}
          >
            {e}
          </span>
        ))}
      </div>

      <div className="bg-mesh min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 relative z-10">
          <header className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-1">
              <div className="relative">
                <ChefHat className="w-10 h-10 text-amber-400 animate-float" />
                {celebrate && (
                  <PartyPopper className="absolute -top-2 -right-2 w-5 h-5 text-pink-400 animate-confetti" />
                )}
              </div>
              <h1 className="font-display text-4xl sm:text-6xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500">
                Pantry Panchayat
              </h1>
            </div>
            <p
              key={taglineIdx}
              className="text-stone-400 text-sm sm:text-base mb-4 animate-slide-up transition-all"
            >
              {FUNNY_TAGLINES[taglineIdx]}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2 bg-stone-900/80 backdrop-blur border border-stone-800 rounded-full px-3 py-1.5 hover:border-amber-700/50 transition-colors">
                <span className="text-stone-500">Council:</span>
                {roommates.map((name, idx) => (
                  <input
                    key={idx}
                    value={name}
                    onChange={(e) => setRoommates((prev) => prev.map((n, i) => (i === idx ? e.target.value : n)))}
                    className="bg-transparent border-b border-stone-700 focus:border-amber-400 outline-none w-24 text-stone-100 transition-colors"
                  />
                ))}
              </div>
              <StatPill label="Items tracked" value={inventory.length} />
              <StatPill
                label="Low stock"
                value={lowStock.length}
                alert={lowStock.length > 0}
              />
              <StatPill label="Meals this week" value={mealsThisWeek} icon="🔥" />
            </div>
          </header>

          <div className="flex gap-1 flex-wrap animate-slide-up" style={{ animationDelay: "0.1s" }}>
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`group flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-all duration-300 ${
                    active
                      ? "bg-stone-50 text-stone-900 shadow-lg shadow-amber-500/10 scale-[1.02]"
                      : "bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800"
                  }`}
                >
                  <span className="text-base group-hover:animate-wiggle">{t.emoji}</span>
                  <Icon className="w-4 h-4" />
                  {t.label}
                  {t.id === "restock" && lowStock.length > 0 && (
                    <span className="ml-1 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      {lowStock.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            key={tab}
            className="bg-stone-50 text-stone-900 rounded-b-2xl rounded-tr-2xl p-5 sm:p-7 min-h-[420px] shadow-2xl shadow-black/30 border border-stone-200/50 tab-content-enter"
          >
            {tab === "pantry" && (
              <PantryTab
                form={form}
                setForm={setForm}
                formError={formError}
                setFormError={setFormError}
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
                spinMsg={spinMsg}
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
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3.5 rounded-xl shadow-2xl border flex items-center gap-2.5 text-sm max-w-md animate-bounce-in z-50 ${
            toast.type === "info"
              ? "bg-stone-800 text-stone-100 border-stone-700"
              : "bg-gradient-to-r from-emerald-50 to-amber-50 text-stone-900 border-emerald-200"
          }`}
        >
          {toast.type === "info" ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, alert, icon }) {
  return (
    <div
      className={`rounded-full px-3 py-1.5 border transition-all hover:scale-105 ${
        alert ? "bg-red-950/80 border-red-800 text-red-300 animate-pulse-glow" : "bg-stone-900/80 border-stone-800 text-stone-300"
      }`}
    >
      <span className="opacity-70">{label}:</span>{" "}
      <span className="font-mono text-stone-100">
        {icon && <span className="mr-0.5">{icon}</span>}
        {value}
      </span>
    </div>
  );
}

function PantryTab({ form, setForm, formError, setFormError, addItem, grouped, lowStock, nudgeQty, deleteItem, inventory, loadDemoPantry }) {
  return (
    <div>
      <form
        onSubmit={addItem}
        className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6 p-4 bg-gradient-to-br from-amber-50 to-stone-100 rounded-xl border border-amber-200/60"
      >
        <input
          placeholder="Item name (e.g. Garam Masala)"
          value={form.name}
          onChange={(e) => {
            setFormError("");
            setForm((f) => ({ ...f, name: e.target.value }));
          }}
          className="col-span-2 border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-shadow"
        />
        <input
          placeholder="Qty"
          type="number"
          step="any"
          min="0"
          value={form.quantity}
          onChange={(e) => {
            setFormError("");
            setForm((f) => ({ ...f, quantity: e.target.value }));
          }}
          className="border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow"
        />
        <select
          value={form.unit}
          onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          className="border border-stone-300 rounded-lg px-2 py-2.5 text-sm focus:ring-2 focus:ring-amber-400"
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
          className="border border-stone-300 rounded-lg px-2 py-2.5 text-sm focus:ring-2 focus:ring-amber-400"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_EMOJI[c]} {c}
            </option>
          ))}
        </select>
        <input
          placeholder="Reorder at"
          type="number"
          step="any"
          min="0"
          value={form.reorderLevel}
          onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))}
          className="border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow"
        />
        <button
          type="submit"
          className="col-span-2 sm:col-span-6 sm:w-auto sm:justify-self-start flex items-center justify-center gap-2 bg-gradient-to-r from-stone-900 to-stone-800 text-stone-50 rounded-lg px-5 py-2.5 text-sm font-semibold hover:from-amber-600 hover:to-orange-600 hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg shadow-stone-900/20"
        >
          <Plus className="w-4 h-4" /> Add to pantry
        </button>
        {formError && (
          <p className="col-span-2 sm:col-span-6 text-sm text-red-600 flex items-center gap-1.5 animate-slide-up">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {formError}
          </p>
        )}
      </form>

      {inventory.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-amber-300/60 rounded-2xl bg-gradient-to-b from-white to-amber-50/30 animate-fade-in">
          <div className="text-6xl mb-4 animate-float">🫙</div>
          <p className="text-stone-600 mb-2 font-medium">Your pantry is emptier than a hostel mess on Sunday.</p>
          <p className="text-stone-500 text-sm mb-6">Add what's actually in your kitchen, or cheat with our demo stash.</p>
          <button
            onClick={loadDemoPantry}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-stone-900 rounded-lg px-6 py-2.5 text-sm font-bold hover:from-amber-400 hover:to-orange-400 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/30"
          >
            Load demo pantry ✨
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((g, gi) => (
            <div key={g.category} className="animate-slide-up" style={{ animationDelay: `${gi * 0.08}s` }}>
              <h3 className="font-display text-xl tracking-wide text-stone-500 mb-3 flex items-center gap-2">
                <span className="text-2xl">{CATEGORY_EMOJI[g.category]}</span>
                {g.category}
              </h3>
              <div className="space-y-2">
                {g.items.map((item, ii) => {
                  const isLow = lowStock.some((l) => l.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`item-enter flex items-center justify-between gap-2 rounded-xl px-4 py-3 border transition-all hover:shadow-md hover:-translate-y-0.5 ${
                        isLow ? "bg-red-50 border-red-200 hover:border-red-300" : "bg-white border-stone-200 hover:border-amber-200"
                      }`}
                      style={{ animationDelay: `${ii * 0.05}s` }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium truncate">{item.name}</span>
                        {isLow && (
                          <span className="text-[10px] uppercase font-bold bg-red-600 text-white rounded-full px-2 py-0.5 shrink-0 animate-pulse">
                            Low 🚨
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => nudgeQty(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-red-100 hover:text-red-600 text-sm font-bold transition-colors active:scale-90"
                        >
                          −
                        </button>
                        <span className="font-mono text-sm w-24 text-center bg-stone-50 rounded-md py-1">
                          {item.quantity}
                          {item.unit}
                        </span>
                        <button
                          onClick={() => nudgeQty(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-emerald-100 hover:text-emerald-600 text-sm font-bold transition-colors active:scale-90"
                        >
                          +
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-stone-400 hover:text-red-600 ml-1 transition-colors hover:scale-110"
                        >
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
  spinMsg,
  spinCookTurn,
}) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-3">
        <div>
          <label className="block text-xs text-stone-500 mb-1 font-medium">Meal</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400"
          >
            {["Breakfast", "Lunch", "Dinner", "Snack"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-stone-500 mb-1 font-medium">Preferences (optional)</label>
          <input
            value={prefText}
            onChange={(e) => setPrefText(e.target.value)}
            placeholder="e.g. quick, no onion, something spicy"
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <button
          onClick={askPanchayat}
          disabled={aiLoading}
          type="button"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-stone-900 rounded-lg px-5 py-2.5 text-sm font-bold whitespace-nowrap transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-amber-500/25 cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${aiLoading ? "animate-spin-slow" : ""}`} />
          {aiLoading ? "Deliberating…" : "Ask the Panchayat"}
        </button>
      </div>

      {inventory.length === 0 && (
        <p className="text-sm text-stone-500 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          🫠 Add pantry items first — the council can't cook air (yet).
        </p>
      )}
      {aiError && (
        <p className="text-sm text-red-600 mb-4 flex items-center gap-1.5 p-3 bg-red-50 rounded-lg border border-red-200 animate-slide-up">
          <AlertTriangle className="w-4 h-4" />
          {aiError}
        </p>
      )}

      {aiLoading && (
        <div className="flex flex-col items-center py-12 animate-fade-in">
          <div className="flex gap-2 mb-4">
            {["🧑‍⚖️", "🍳", "📝"].map((e, i) => (
              <span key={i} className="text-3xl animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>
                {e}
              </span>
            ))}
          </div>
          <p className="text-stone-500 text-sm">The council is in session…</p>
        </div>
      )}

      {suggestions && (
        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          {suggestions.map((dish, idx) => (
            <div
              key={idx}
              className="relative border border-stone-200 rounded-xl p-4 bg-white flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-bounce-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <span className="stamp absolute -top-3 -right-3 bg-white text-red-600 text-[9px] font-bold uppercase px-2 py-1 leading-tight">
                Verdict
              </span>
              <h4 className="font-display text-2xl tracking-wide mb-0.5 text-stone-800">{dish.name}</h4>
              <p className="text-xs text-stone-500 mb-2">
                {dish.cuisine} · {dish.timeMinutes} min
              </p>
              <p className="text-sm text-stone-700 mb-3 italic">"{dish.description}"</p>
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
                <p className="text-xs text-amber-700 mb-3 bg-amber-50 rounded-md px-2 py-1">
                  🛒 Need to buy: {dish.extraNeeded.join(", ")}
                </p>
              )}
              <div className="mt-auto pt-2">
                {confirmIndex === idx ? (
                  <div className="flex items-center gap-2 animate-slide-up">
                    <select
                      value={confirmCook}
                      onChange={(e) => setConfirmCook(e.target.value)}
                      className="border border-stone-300 rounded-lg px-2 py-1.5 text-xs flex-1"
                    >
                      {roommates.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => confirmCooked(dish)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105"
                    >
                      Confirm ✓
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setConfirmIndex(idx);
                      setConfirmCook(roommates[0]);
                    }}
                    className="w-full bg-stone-900 hover:bg-amber-600 text-white rounded-lg px-3 py-2.5 text-xs font-semibold transition-all hover:scale-[1.02]"
                  >
                    Cook this 🍳
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-stone-200">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={spinCookTurn}
            disabled={spinning}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-100 to-purple-100 hover:from-violet-200 hover:to-purple-200 border border-violet-200 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-70"
          >
            <Shuffle className={`w-4 h-4 ${spinning ? "animate-spin-slow" : ""}`} />
            Whose turn to cook?
          </button>
          {spinning && (
            <div className="flex gap-1">
              {roommates.map((r, i) => (
                <span
                  key={r}
                  className="px-3 py-1 bg-white border border-stone-200 rounded-full text-sm font-medium animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {r}
                </span>
              ))}
            </div>
          )}
          {!spinning && spinResult && (
            <div className="animate-bounce-in flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-xl px-4 py-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm">
                <strong>{spinResult}</strong> {spinMsg}
              </span>
            </div>
          )}
        </div>
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
      <h3 className="font-display text-xl tracking-wide text-stone-500 mb-3 flex items-center gap-2">
        <span className="text-2xl">🚨</span> Running low
      </h3>
      {lowStock.length === 0 ? (
        <div className="text-center py-8 mb-8 bg-emerald-50 rounded-xl border border-emerald-200 animate-fade-in">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-sm text-emerald-700 font-medium">All stocked up! The council is impressed (for now).</p>
        </div>
      ) : (
        <div className="space-y-2 mb-8">
          {lowStock.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex-wrap hover:shadow-md transition-all item-enter"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
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
                  min="0"
                  value={restockInputs[item.id] || ""}
                  onChange={(e) => setRestockInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  className="w-24 border border-stone-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  onClick={() => restockItem(item.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-1.5 text-xs font-semibold transition-all hover:scale-105"
                >
                  Restock
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="font-display text-xl tracking-wide text-stone-500 mb-3 flex items-center gap-2">
        <span className="text-2xl">🛒</span> Shopping list extras
      </h3>
      <form onSubmit={addExtra} className="flex gap-2 mb-3">
        <input
          value={extraInput}
          onChange={(e) => setExtraInput(e.target.value)}
          placeholder="e.g. curd, coriander, willpower"
          className="flex-1 border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          className="bg-stone-900 hover:bg-amber-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-all hover:scale-105"
        >
          Add
        </button>
      </form>
      <div className="space-y-2">
        {shoppingExtras.length === 0 && (
          <p className="text-sm text-stone-400 italic py-4">Nothing extra yet. Living dangerously, are we?</p>
        )}
        {shoppingExtras.map((x, i) => (
          <div
            key={x.id}
            className="flex items-center justify-between px-4 py-2.5 border border-stone-200 rounded-xl bg-white hover:border-amber-200 transition-all item-enter"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={x.done}
                onChange={() => toggleExtra(x.id)}
                className="rounded accent-emerald-600 w-4 h-4"
              />
              <span className={x.done ? "line-through text-stone-400" : ""}>{x.name}</span>
            </label>
            <button onClick={() => removeExtra(x.id)} className="text-stone-400 hover:text-red-600 transition-colors">
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
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="text-5xl mb-4">📜</div>
        <p className="text-stone-500 mb-2">No meals logged yet.</p>
        <p className="text-sm text-stone-400">Cook something from the Panchayat tab and confirm it here. Your future self will thank you.</p>
      </div>
    );
  }
  const counts = {};
  history.forEach((h) => {
    counts[h.dishName] = (counts[h.dishName] || 0) + 1;
  });
  const favorite = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
        <p className="text-sm text-stone-700">
          <span className="font-bold text-2xl font-display text-amber-600">{history.length}</span> meals logged · crowd favorite:{" "}
          <span className="font-semibold text-stone-900">{favorite[0]}</span> ({favorite[1]}×) 🏆
        </p>
      </div>
      <div className="space-y-2">
        {history.map((h, i) => (
          <div
            key={h.id}
            className="border border-stone-200 rounded-xl px-4 py-3 bg-white hover:shadow-md hover:border-amber-200 transition-all item-enter"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <div className="flex justify-between items-baseline">
              <span className="font-semibold">{h.dishName}</span>
              <span className="text-xs text-stone-400">
                {new Date(h.date).toLocaleDateString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              {h.cuisine} · cooked by {h.cookedBy} 👨‍🍳
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
