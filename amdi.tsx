import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Heart, Droplet, UtensilsCrossed, Calendar, Gift, MapPin,
  ThumbsUp, ThumbsDown, HandHeart, Mail, Dumbbell, TrendingUp,
  Check, Plus, X, Trash2, Sparkles, Flame, Eye, EyeOff,
  Bell, BellOff, MessageCircleHeart
} from "lucide-react";

// ---------- palette ----------
const ROSE = "#B5495B";
const INK = "#2E1F27";
const GOLD = "#C9A66B";
const BLUSH = "#F6E9E4";
const CREAM = "#FBF6F1";
const MUTE = "#8A7268";

const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);
const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const WEEKDAY_LABEL = { SU: "Sun", MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu", FR: "Fri", SA: "Sat" };

const MOTIVATION = [
  "She's waiting on the other side of your discipline. Get up.",
  "Every rep, every hour of work — it's a brick in the life you're building for her.",
  "She's beautiful and she's yours. Be the man worth that.",
  "Broke and undisciplined isn't the plan. Built and steady is.",
  "You don't grind for applause. You grind so she never has to worry.",
  "One more set. One more hour of focus. She deserves the best version of you.",
  "The man she needs is built in the quiet reps nobody sees.",
  "Get sharp, get strong, get paid — then come home and hold her.",
];

const TABS = [
  { id: "today", label: "Today", icon: Heart },
  { id: "cycle", label: "Cycle", icon: Calendar },
  { id: "wishlist", label: "Wishlist", icon: Gift },
  { id: "dates", label: "Dates", icon: MapPin },
  { id: "notes", label: "Her", icon: HandHeart },
  { id: "promises", label: "Promises", icon: Check },
  { id: "letters", label: "Letters", icon: Mail },
  { id: "growth", label: "Myself", icon: Dumbbell },
  { id: "ask", label: "Ask", icon: MessageCircleHeart },
];

// ---------- storage ----------
async function loadAll() {
  const keys = ["completions", "cycle", "wishlist", "dates", "notes", "promises", "letters", "growth", "hairOil", "notifSettings"];
  const out = {};
  for (const k of keys) {
    try {
      const r = await window.storage.get(k, false);
      out[k] = r ? JSON.parse(r.value) : null;
    } catch { out[k] = null; }
  }
  return out;
}
async function save(key, value) {
  try { await window.storage.set(key, JSON.stringify(value), false); } catch (e) { console.error(e); }
}

// ---------- date helpers ----------
function nextScheduledDate(fromDate, days) {
  if (!days || days.length === 0) return null;
  const d = new Date(fromDate);
  for (let i = 0; i < 8; i++) {
    d.setDate(d.getDate() + (i === 0 ? 0 : 1));
    if (days.includes(WEEKDAYS[d.getDay()])) return new Date(d);
  }
  return null;
}
function isScheduledToday(days) { return days && days.includes(WEEKDAYS[new Date().getDay()]); }
function fmt(d) { return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }); }
function daysBetween(a, b) { return Math.round((new Date(b).setHours(0,0,0,0) - new Date(a).setHours(0,0,0,0)) / 86400000); }

// ---------- atoms ----------
function Section({ title, subtitle, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-serif" style={{ color: INK }}>{title}</h2>
      {subtitle && <p className="text-sm mt-1" style={{ color: MUTE }}>{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}
function IconBtn({ onClick, children, title }) {
  return <button onClick={onClick} title={title} className="p-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: MUTE }}>{children}</button>;
}
function TextRow({ value, onChange, onSubmit, placeholder }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="flex gap-2">
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="flex-1 rounded-xl px-4 py-2.5 border outline-none text-sm" style={{ borderColor: "#E4D3C8", background: "#fff", color: INK }} />
      <button type="submit" className="rounded-xl px-4 flex items-center justify-center" style={{ background: ROSE, color: "#fff" }}><Plus size={18} /></button>
    </form>
  );
}

// ---------- app ----------
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("today");

  const [completions, setCompletions] = useState({});
  const [cycle, setCycle] = useState({ lastStart: "", length: 28 });
  const [wishlist, setWishlist] = useState([]);
  const [dates, setDates] = useState([]);
  const [notes, setNotes] = useState({ likes: [], dislikes: [] });
  const [promises, setPromises] = useState([]);
  const [letters, setLetters] = useState([]);
  const [growth, setGrowth] = useState({ physique: [], finance: [], streak: 0, lastCheckin: "", pushupsLog: {}, pushupsStreak: 0 });
  const [hairOil, setHairOil] = useState({ lastOiled: "2026-07-01", days: ["MO", "WE", "FR"], log: {} });
  const [notifSettings, setNotifSettings] = useState({ enabled: false, pushupsTime: "07:00" });

  const [newItem, setNewItem] = useState("");
  const [revealedItems, setRevealedItems] = useState({});
  const [newDateTitle, setNewDateTitle] = useState("");
  const [newDateDate, setNewDateDate] = useState("");
  const [newLike, setNewLike] = useState("");
  const [newDislike, setNewDislike] = useState("");
  const [newPromise, setNewPromise] = useState("");
  const [newLetterNote, setNewLetterNote] = useState("");
  const [newPhysiqueGoal, setNewPhysiqueGoal] = useState("");
  const [newFinanceGoal, setNewFinanceGoal] = useState("");
  const [quote, setQuote] = useState(MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)]);
  const notifiedRef = useRef({});
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, chatLoading]);

  useEffect(() => {
    (async () => {
      const all = await loadAll();
      if (all.completions) setCompletions(all.completions);
      if (all.cycle) setCycle(all.cycle);
      if (all.wishlist) setWishlist(all.wishlist);
      if (all.dates) setDates(all.dates);
      if (all.notes) setNotes(all.notes);
      if (all.promises) setPromises(all.promises);
      if (all.letters) setLetters(all.letters);
      if (all.growth) setGrowth((g) => ({ ...g, ...all.growth }));
      if (all.hairOil) setHairOil(all.hairOil);
      if (all.notifSettings) setNotifSettings(all.notifSettings);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!notifSettings.enabled) return;
    const check = () => {
      const now = new Date();
      const hhmm = now.toTimeString().slice(0, 5);
      const key = `${todayKey()}-${hhmm}`;
      if (hhmm === notifSettings.pushupsTime && notifiedRef.current[key] !== true) {
        notifiedRef.current[key] = true;
        fireNotification("Push-ups", "Time for today's push-ups. Build for her.");
      }
      if (isScheduledToday(hairOil.days)) {
        const oilKey = `${todayKey()}-oil-09:00`;
        if (hhmm === "09:00" && notifiedRef.current[oilKey] !== true) {
          notifiedRef.current[oilKey] = true;
          fireNotification("Oil day", "Today's a hair-oiling day for her.");
        }
      }
    };
    const id = setInterval(check, 20000);
    return () => clearInterval(id);
  }, [notifSettings, hairOil]);

  function fireNotification(title, body) {
    try {
      if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body });
      beep();
    } catch {}
  }
  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = 720;
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      o.start(); o.stop(ctx.currentTime + 0.5);
    } catch {}
  }
  async function enableNotifications() {
    let granted = true;
    if ("Notification" in window && Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      granted = perm === "granted";
    }
    const next = { ...notifSettings, enabled: granted };
    setNotifSettings(next); save("notifSettings", next);
  }
  function disableNotifications() {
    const next = { ...notifSettings, enabled: false };
    setNotifSettings(next); save("notifSettings", next);
  }
  function setPushupsTime(t) {
    const next = { ...notifSettings, pushupsTime: t };
    setNotifSettings(next); save("notifSettings", next);
  }

  const persist = useCallback((key, setter, value) => { setter(value); save(key, value); }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CREAM }}>
        <Heart className="animate-pulse" size={32} style={{ color: ROSE }} />
      </div>
    );
  }

  const today = todayKey();
  const todaysDone = completions[today] || {};
  const oilToday = isScheduledToday(hairOil.days);
  const oilDoneToday = !!hairOil.log[today];
  const nextOil = oilToday ? new Date() : nextScheduledDate(new Date(), hairOil.days);
  const lastOiledDaysAgo = hairOil.lastOiled ? daysBetween(hairOil.lastOiled, new Date()) : null;
  const pushupsDoneToday = !!growth.pushupsLog[today];

  function toggleGenericTask(id) {
    const rec = { ...(completions[today] || {}) };
    rec[id] = !rec[id];
    persist("completions", setCompletions, { ...completions, [today]: rec });
  }
  function toggleOilToday() {
    const next = { ...hairOil, log: { ...hairOil.log, [today]: !oilDoneToday }, lastOiled: !oilDoneToday ? today : hairOil.lastOiled };
    persist("hairOil", setHairOil, next);
  }
  function toggleOilDay(day) {
    const has = hairOil.days.includes(day);
    const nextDays = has ? hairOil.days.filter((d) => d !== day) : [...hairOil.days, day];
    persist("hairOil", setHairOil, { ...hairOil, days: nextDays });
  }
  function nextPeriodDate() {
    if (!cycle.lastStart) return null;
    const start = new Date(cycle.lastStart + "T00:00:00");
    const d = new Date(start);
    d.setDate(d.getDate() + Number(cycle.length || 28));
    return d;
  }
  function addWishlistItem() {
    if (!newItem.trim()) return;
    persist("wishlist", setWishlist, [...wishlist, { id: Date.now(), item: newItem.trim(), bought: false }]);
    setNewItem("");
  }
  function toggleBought(id) { persist("wishlist", setWishlist, wishlist.map((w) => w.id === id ? { ...w, bought: !w.bought } : w)); }
  function removeWishlist(id) { persist("wishlist", setWishlist, wishlist.filter((w) => w.id !== id)); }
  function toggleReveal(id) { setRevealedItems((r) => ({ ...r, [id]: !r[id] })); }
  function addDate() {
    if (!newDateTitle.trim()) return;
    const next = [...dates, { id: Date.now(), title: newDateTitle.trim(), date: newDateDate, done: false }].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
    persist("dates", setDates, next);
    setNewDateTitle(""); setNewDateDate("");
  }
  function toggleDateDone(id) { persist("dates", setDates, dates.map((d) => d.id === id ? { ...d, done: !d.done } : d)); }
  function removeDate(id) { persist("dates", setDates, dates.filter((d) => d.id !== id)); }
  function addLike() { if (!newLike.trim()) return; persist("notes", setNotes, { ...notes, likes: [...notes.likes, newLike.trim()] }); setNewLike(""); }
  function addDislike() { if (!newDislike.trim()) return; persist("notes", setNotes, { ...notes, dislikes: [...notes.dislikes, newDislike.trim()] }); setNewDislike(""); }
  function removeLike(i) { persist("notes", setNotes, { ...notes, likes: notes.likes.filter((_, idx) => idx !== i) }); }
  function removeDislike(i) { persist("notes", setNotes, { ...notes, dislikes: notes.dislikes.filter((_, idx) => idx !== i) }); }
  function addPromise() { if (!newPromise.trim()) return; persist("promises", setPromises, [...promises, { id: Date.now(), text: newPromise.trim(), done: false }]); setNewPromise(""); }
  function togglePromise(id) { persist("promises", setPromises, promises.map((p) => p.id === id ? { ...p, done: !p.done } : p)); }
  function removePromise(id) { persist("promises", setPromises, promises.filter((p) => p.id !== id)); }
  function logLetter() { persist("letters", setLetters, [{ id: Date.now(), date: today, note: newLetterNote.trim() }, ...letters]); setNewLetterNote(""); }
  function removeLetter(id) { persist("letters", setLetters, letters.filter((l) => l.id !== id)); }
  function addGrowthGoal(category, text, clear) {
    if (!text.trim()) return;
    const next = { ...growth, [category]: [...growth[category], { id: Date.now(), text: text.trim(), done: false }] };
    persist("growth", setGrowth, next); clear("");
  }
  function toggleGrowthGoal(category, id) { persist("growth", setGrowth, { ...growth, [category]: growth[category].map((g) => g.id === id ? { ...g, done: !g.done } : g) }); }
  function removeGrowthGoal(category, id) { persist("growth", setGrowth, { ...growth, [category]: growth[category].filter((g) => g.id !== id) }); }
  function toggleCheckin() {
    const wasToday = growth.lastCheckin === today;
    persist("growth", setGrowth, { ...growth, streak: wasToday ? Math.max(0, growth.streak - 1) : growth.streak + 1, lastCheckin: wasToday ? "" : today });
  }
  function togglePushups() {
    const done = !!growth.pushupsLog[today];
    persist("growth", setGrowth, { ...growth, pushupsLog: { ...growth.pushupsLog, [today]: !done }, pushupsStreak: Math.max(0, growth.pushupsStreak + (done ? -1 : 1)) });
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const nextChat = [...chat, { role: "user", content: text }];
    setChat(nextChat); setChatInput(""); setChatLoading(true);

    const context = `
You are the "Ask AMDI" assistant inside a private app Divine built for his girlfriend, Amarachi. Be warm, direct, and practical. Keep answers concise for a phone screen unless asked for more.

What's known (private to Divine):
- She loves: ${notes.likes.join(", ") || "not noted yet"}
- She dislikes: ${notes.dislikes.join(", ") || "not noted yet"}
- Wishlist ideas: ${wishlist.map((w) => w.item).join(", ") || "none yet"}
- Open promises: ${promises.filter((p) => !p.done).map((p) => p.text).join(", ") || "none pending"}
- She's working on eating earlier and smaller portions, together with him.
- He oils her hair ${hairOil.days.map((d) => WEEKDAY_LABEL[d]).join("/")} and is building his own physique and finances for her.
`.trim();

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: context,
          messages: nextChat.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = (data.content || []).map((b) => b.text || "").join("\n").trim() || "Something went wrong — try again.";
      setChat((c) => [...c, { role: "assistant", content: reply }]);
    } catch (e) {
      setChat((c) => [...c, { role: "assistant", content: "Couldn't reach the assistant just now — try again in a moment." }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: CREAM, fontFamily: "Georgia, 'Iowan Old Style', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Parisienne&display=swap');
        .amdi-script { font-family: 'Parisienne', cursive; }
        .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        input, textarea { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>

      {/* header */}
      <div className="px-5 pt-8 pb-6 text-center" style={{ background: `linear-gradient(180deg, ${BLUSH}, ${CREAM})` }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span style={{ width: 16, height: 1, background: GOLD }} />
          <Heart size={13} style={{ color: ROSE }} fill={ROSE} />
          <span style={{ width: 16, height: 1, background: GOLD }} />
        </div>
        <h1 className="amdi-script text-4xl mt-1" style={{ color: ROSE }}>Amarachi &amp; Divine</h1>
        <p className="sans text-[11px] tracking-[0.3em] mt-1" style={{ color: MUTE }}>AMDI</p>
      </div>

      <div className="px-5">
        {tab === "today" && (
          <>
            <Section title="Today's care" subtitle={fmt(new Date())}>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-2xl px-4 py-3 border sans" style={{ background: "#fff", borderColor: "#E4D3C8" }}>
                  <button onClick={toggleOilToday} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2" style={{ borderColor: oilToday ? ROSE : "#D8C4B8", background: oilDoneToday ? ROSE : "transparent" }}>
                    {oilDoneToday && <Check size={14} color="#fff" />}
                  </button>
                  <Droplet size={16} style={{ color: MUTE }} />
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: INK, textDecoration: oilDoneToday ? "line-through" : "none", opacity: oilDoneToday ? 0.5 : 1 }}>Oil her hair</p>
                    <p className="text-xs" style={{ color: MUTE }}>{oilToday ? "scheduled for today" : nextOil ? `next: ${fmt(nextOil)}` : "set schedule under Myself"}</p>
                  </div>
                </div>
                {[{ id: "warm-food", label: "Warm her food before bed" }, { id: "check-off", label: "Check everything is switched off" }].map((t) => {
                  const done = !!todaysDone[t.id];
                  return (
                    <div key={t.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 border sans" style={{ background: "#fff", borderColor: "#E4D3C8" }}>
                      <button onClick={() => toggleGenericTask(t.id)} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2" style={{ borderColor: ROSE, background: done ? ROSE : "transparent" }}>
                        {done && <Check size={14} color="#fff" />}
                      </button>
                      <span className="flex-1 text-sm" style={{ color: INK, textDecoration: done ? "line-through" : "none", opacity: done ? 0.5 : 1 }}>{t.label}</span>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title="Sweet nudge">
              <div className="rounded-2xl p-5" style={{ background: INK }}>
                <p className="text-sm leading-relaxed" style={{ color: BLUSH }}>{quote}</p>
                <button onClick={() => setQuote(MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)])} className="mt-3 sans text-xs flex items-center gap-1" style={{ color: GOLD }}>
                  <Sparkles size={12} /> another one
                </button>
              </div>
            </Section>
          </>
        )}

        {tab === "cycle" && (
          <Section title="Her cycle" subtitle="So you're never caught off guard">
            <div className="rounded-2xl p-4 border bg-white space-y-3" style={{ borderColor: "#E4D3C8" }}>
              <label className="block sans text-xs" style={{ color: MUTE }}>Last period start date</label>
              <input type="date" value={cycle.lastStart} onChange={(e) => persist("cycle", setCycle, { ...cycle, lastStart: e.target.value })}
                className="w-full rounded-xl px-3 py-2 border sans text-sm" style={{ borderColor: "#E4D3C8" }} />
              <label className="block sans text-xs" style={{ color: MUTE }}>Average cycle length (days)</label>
              <input type="number" value={cycle.length} onChange={(e) => persist("cycle", setCycle, { ...cycle, length: e.target.value })}
                className="w-full rounded-xl px-3 py-2 border sans text-sm" style={{ borderColor: "#E4D3C8" }} />
            </div>
            {nextPeriodDate() && (
              <div className="mt-4 rounded-2xl p-5" style={{ background: BLUSH }}>
                <p className="sans text-xs" style={{ color: MUTE }}>Next expected period</p>
                <p className="text-xl amdi-script" style={{ color: ROSE }}>{fmt(nextPeriodDate())}</p>
                <p className="sans text-sm mt-1" style={{ color: ROSE }}>
                  {daysBetween(new Date(), nextPeriodDate()) >= 0 ? `in ${daysBetween(new Date(), nextPeriodDate())} days` : "may already have started — check in with her"}
                </p>
                <p className="sans text-xs mt-3" style={{ color: MUTE }}>Be extra gentle, keep painkillers & her favorite snack ready.</p>
              </div>
            )}
          </Section>
        )}

        {tab === "wishlist" && (
          <Section title="Things to get her" subtitle="Blurred, in case she picks up your phone">
            <div className="space-y-2 mb-3">
              {wishlist.length === 0 && <p className="sans text-sm" style={{ color: MUTE }}>Nothing yet — add the first surprise.</p>}
              {wishlist.map((w) => {
                const shown = !!revealedItems[w.id];
                return (
                  <div key={w.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 border bg-white sans" style={{ borderColor: "#E4D3C8" }}>
                    <button onClick={() => toggleBought(w.id)} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2" style={{ borderColor: GOLD, background: w.bought ? GOLD : "transparent" }}>
                      {w.bought && <Check size={14} color="#fff" />}
                    </button>
                    <span onClick={() => toggleReveal(w.id)} className="flex-1 text-sm cursor-pointer select-none" style={{ color: INK, textDecoration: w.bought ? "line-through" : "none", opacity: w.bought ? 0.5 : 1, filter: shown ? "none" : "blur(5px)" }}>{w.item}</span>
                    <IconBtn onClick={() => toggleReveal(w.id)}>{shown ? <EyeOff size={14} /> : <Eye size={14} />}</IconBtn>
                    <IconBtn onClick={() => removeWishlist(w.id)}><Trash2 size={14} /></IconBtn>
                  </div>
                );
              })}
            </div>
            <TextRow value={newItem} onChange={setNewItem} onSubmit={addWishlistItem} placeholder="Add a surprise" />
          </Section>
        )}

        {tab === "dates" && (
          <Section title="Date planning" subtitle="Keep the romance moving">
            <div className="space-y-2 mb-3">
              {dates.length === 0 && <p className="sans text-sm" style={{ color: MUTE }}>No dates planned yet.</p>}
              {dates.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 border bg-white sans" style={{ borderColor: "#E4D3C8" }}>
                  <button onClick={() => toggleDateDone(d.id)} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2" style={{ borderColor: ROSE, background: d.done ? ROSE : "transparent" }}>
                    {d.done && <Check size={14} color="#fff" />}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: INK, textDecoration: d.done ? "line-through" : "none", opacity: d.done ? 0.5 : 1 }}>{d.title}</p>
                    {d.date && <p className="text-xs" style={{ color: MUTE }}>{d.date}</p>}
                  </div>
                  <IconBtn onClick={() => removeDate(d.id)}><Trash2 size={14} /></IconBtn>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-3 border bg-white space-y-2" style={{ borderColor: "#E4D3C8" }}>
              <input value={newDateTitle} onChange={(e) => setNewDateTitle(e.target.value)} placeholder="Date idea" className="w-full rounded-xl px-3 py-2 border sans text-sm" style={{ borderColor: "#E4D3C8" }} />
              <input type="date" value={newDateDate} onChange={(e) => setNewDateDate(e.target.value)} className="w-full rounded-xl px-3 py-2 border sans text-sm" style={{ borderColor: "#E4D3C8" }} />
              <button onClick={addDate} className="w-full rounded-xl py-2 sans text-sm" style={{ background: ROSE, color: "#fff" }}>Add date</button>
            </div>
          </Section>
        )}

        {tab === "notes" && (
          <>
            <Section title="She loves" subtitle="Bare minimum stuff, handwritten letters, eating early together">
              <div className="space-y-2 mb-3">
                {notes.likes.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl px-4 py-2.5 border bg-white sans text-sm" style={{ borderColor: "#E4D3C8", color: INK }}>
                    <ThumbsUp size={14} style={{ color: ROSE }} /><span className="flex-1">{l}</span>
                    <IconBtn onClick={() => removeLike(i)}><X size={14} /></IconBtn>
                  </div>
                ))}
              </div>
              <TextRow value={newLike} onChange={setNewLike} onSubmit={addLike} placeholder="Something she loves" />
            </Section>
            <Section title="She's not into">
              <div className="space-y-2 mb-3">
                {notes.dislikes.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl px-4 py-2.5 border bg-white sans text-sm" style={{ borderColor: "#E4D3C8", color: INK }}>
                    <ThumbsDown size={14} style={{ color: MUTE }} /><span className="flex-1">{l}</span>
                    <IconBtn onClick={() => removeDislike(i)}><X size={14} /></IconBtn>
                  </div>
                ))}
              </div>
              <TextRow value={newDislike} onChange={setNewDislike} onSubmit={addDislike} placeholder="Something she dislikes" />
            </Section>
            <Section title="Her food goal" subtitle="Eating early, small portions, together with you">
              <div className="rounded-2xl p-4" style={{ background: BLUSH }}>
                <p className="sans text-sm" style={{ color: INK }}>Eat with her early, keep portions small, and warm her food before bed if she eats late — it's on your Today list.</p>
              </div>
            </Section>
          </>
        )}

        {tab === "promises" && (
          <Section title="Promises to her" subtitle="What you said you'd do">
            <div className="space-y-2 mb-3">
              {promises.length === 0 && <p className="sans text-sm" style={{ color: MUTE }}>Nothing pending — add a promise to track it.</p>}
              {promises.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 border bg-white sans" style={{ borderColor: "#E4D3C8" }}>
                  <button onClick={() => togglePromise(p.id)} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2" style={{ borderColor: ROSE, background: p.done ? ROSE : "transparent" }}>
                    {p.done && <Check size={14} color="#fff" />}
                  </button>
                  <span className="flex-1 text-sm" style={{ color: INK, textDecoration: p.done ? "line-through" : "none", opacity: p.done ? 0.5 : 1 }}>{p.text}</span>
                  <IconBtn onClick={() => removePromise(p.id)}><Trash2 size={14} /></IconBtn>
                </div>
              ))}
            </div>
            <TextRow value={newPromise} onChange={setNewPromise} onSubmit={addPromise} placeholder="What did you promise her?" />
          </Section>
        )}

        {tab === "letters" && (
          <Section title="Handwritten letters" subtitle="Log when you write her one">
            <div className="rounded-2xl p-3 border bg-white space-y-2 mb-4" style={{ borderColor: "#E4D3C8" }}>
              <textarea value={newLetterNote} onChange={(e) => setNewLetterNote(e.target.value)} placeholder="What was this letter about? (optional)" rows={2} className="w-full rounded-xl px-3 py-2 border sans text-sm resize-none" style={{ borderColor: "#E4D3C8" }} />
              <button onClick={logLetter} className="w-full rounded-xl py-2 sans text-sm" style={{ background: ROSE, color: "#fff" }}>Log today's letter</button>
            </div>
            <div className="space-y-2">
              {letters.length === 0 && <p className="sans text-sm" style={{ color: MUTE }}>No letters logged yet.</p>}
              {letters.map((l) => (
                <div key={l.id} className="flex items-start gap-3 rounded-2xl px-4 py-3 border bg-white sans" style={{ borderColor: "#E4D3C8" }}>
                  <Mail size={16} className="mt-0.5" style={{ color: ROSE }} />
                  <div className="flex-1">
                    <p className="text-xs" style={{ color: MUTE }}>{l.date}</p>
                    {l.note && <p className="text-sm mt-0.5" style={{ color: INK }}>{l.note}</p>}
                  </div>
                  <IconBtn onClick={() => removeLetter(l.id)}><Trash2 size={14} /></IconBtn>
                </div>
              ))}
            </div>
          </Section>
        )}

        {tab === "growth" && (
          <>
            <Section title="Building myself for her" subtitle="Physique, money, mind — the man she deserves">
              <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: INK }}>
                <div>
                  <p className="sans text-xs" style={{ color: GOLD }}>discipline streak</p>
                  <p className="text-2xl amdi-script" style={{ color: "#fff" }}>{growth.streak} days</p>
                </div>
                <button onClick={toggleCheckin} className="rounded-full p-3" style={{ background: growth.lastCheckin === today ? GOLD : "#4a3a44" }}>
                  <Flame size={20} color="#fff" />
                </button>
              </div>
            </Section>

            <Section title="Push-ups">
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3 border bg-white sans" style={{ borderColor: "#E4D3C8" }}>
                <button onClick={togglePushups} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2" style={{ borderColor: ROSE, background: pushupsDoneToday ? ROSE : "transparent" }}>
                  {pushupsDoneToday && <Check size={14} color="#fff" />}
                </button>
                <Dumbbell size={15} style={{ color: MUTE }} />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: INK, textDecoration: pushupsDoneToday ? "line-through" : "none", opacity: pushupsDoneToday ? 0.5 : 1 }}>Today's push-ups</p>
                  <p className="text-xs" style={{ color: MUTE }}>{growth.pushupsStreak} day streak</p>
                </div>
              </div>
            </Section>

            <Section title="Physique goals">
              <div className="space-y-2 mb-3">
                {growth.physique.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 border bg-white sans" style={{ borderColor: "#E4D3C8" }}>
                    <button onClick={() => toggleGrowthGoal("physique", g.id)} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2" style={{ borderColor: ROSE, background: g.done ? ROSE : "transparent" }}>
                      {g.done && <Check size={14} color="#fff" />}
                    </button>
                    <span className="flex-1 text-sm" style={{ color: INK, textDecoration: g.done ? "line-through" : "none", opacity: g.done ? 0.5 : 1 }}>{g.text}</span>
                    <IconBtn onClick={() => removeGrowthGoal("physique", g.id)}><X size={14} /></IconBtn>
                  </div>
                ))}
              </div>
              <TextRow value={newPhysiqueGoal} onChange={setNewPhysiqueGoal} onSubmit={() => addGrowthGoal("physique", newPhysiqueGoal, setNewPhysiqueGoal)} placeholder="e.g. gym 5x this week" />
            </Section>

            <Section title="Money / intellect goals">
              <div className="space-y-2 mb-3">
                {growth.finance.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 border bg-white sans" style={{ borderColor: "#E4D3C8" }}>
                    <button onClick={() => toggleGrowthGoal("finance", g.id)} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2" style={{ borderColor: GOLD, background: g.done ? GOLD : "transparent" }}>
                      {g.done && <Check size={14} color="#fff" />}
                    </button>
                    <TrendingUp size={14} style={{ color: MUTE }} />
                    <span className="flex-1 text-sm" style={{ color: INK, textDecoration: g.done ? "line-through" : "none", opacity: g.done ? 0.5 : 1 }}>{g.text}</span>
                    <IconBtn onClick={() => removeGrowthGoal("finance", g.id)}><X size={14} /></IconBtn>
                  </div>
                ))}
              </div>
              <TextRow value={newFinanceGoal} onChange={setNewFinanceGoal} onSubmit={() => addGrowthGoal("finance", newFinanceGoal, setNewFinanceGoal)} placeholder="e.g. finish that course, save this month" />
            </Section>

            <Section title="Hair-oil schedule">
              <div className="rounded-2xl p-4 border bg-white" style={{ borderColor: "#E4D3C8" }}>
                <div className="flex gap-2 flex-wrap mb-3">
                  {WEEKDAYS.map((d) => {
                    const on = hairOil.days.includes(d);
                    return (
                      <button key={d} onClick={() => toggleOilDay(d)} className="px-3 py-1.5 rounded-full text-xs sans" style={{ background: on ? ROSE : "transparent", color: on ? "#fff" : MUTE, border: `1px solid ${on ? ROSE : "#E4D3C8"}` }}>
                        {WEEKDAY_LABEL[d]}
                      </button>
                    );
                  })}
                </div>
                <p className="sans text-xs" style={{ color: MUTE }}>
                  {hairOil.days.length}x a week · last oiled {hairOil.lastOiled ? fmt(new Date(hairOil.lastOiled + "T00:00:00")) : "—"}
                  {lastOiledDaysAgo !== null && ` (${lastOiledDaysAgo} days ago)`}
                </p>
              </div>
            </Section>

            <Section title="Reminders">
              <div className="rounded-2xl p-4 border bg-white sans" style={{ borderColor: "#E4D3C8" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm" style={{ color: INK }}>Notifications while app is open</span>
                  {notifSettings.enabled ? (
                    <button onClick={disableNotifications} className="p-1.5"><Bell size={16} style={{ color: ROSE }} /></button>
                  ) : (
                    <button onClick={enableNotifications} className="p-1.5"><BellOff size={16} style={{ color: MUTE }} /></button>
                  )}
                </div>
                <label className="block text-xs mb-1" style={{ color: MUTE }}>Push-ups reminder time</label>
                <input type="time" value={notifSettings.pushupsTime} onChange={(e) => setPushupsTime(e.target.value)} className="w-full rounded-xl px-3 py-2 border text-sm" style={{ borderColor: "#E4D3C8" }} />
                <p className="text-xs mt-2" style={{ color: MUTE }}>Only fires while this page is open. For a true alarm, set the same time in your phone's clock app.</p>
              </div>
            </Section>
          </>
        )}

        {tab === "ask" && (
          <Section title="Ask AMDI" subtitle="Date ideas, gift ideas, help with words — grounded in what you've saved">
            <div className="space-y-3 mb-4">
              {chat.length === 0 && <p className="sans text-sm italic" style={{ color: MUTE }}>Try: "give me a date idea for Saturday" or "help me write something for her letter."</p>}
              {chat.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="rounded-2xl px-4 py-2.5 max-w-[85%] sans text-sm leading-relaxed" style={{ background: m.role === "user" ? ROSE : "#fff", color: m.role === "user" ? "#fff" : INK, border: m.role === "user" ? "none" : "1px solid #E4D3C8" }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && <div className="flex justify-start"><div className="sans text-xs italic px-4" style={{ color: MUTE }}>thinking…</div></div>}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="flex gap-2 sticky bottom-4">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask something…" className="flex-1 rounded-xl px-4 py-2.5 border outline-none sans text-sm" style={{ borderColor: "#E4D3C8", background: "#fff", color: INK }} />
              <button type="submit" disabled={chatLoading} className="rounded-xl px-4 flex items-center justify-center" style={{ background: ROSE, color: "#fff", opacity: chatLoading ? 0.5 : 1 }}><Plus size={18} /></button>
            </form>
          </Section>
        )}
      </div>

      {/* bottom nav — grid, nothing hidden */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur px-2 py-2" style={{ borderColor: "#E4D3C8" }}>
        <div className="grid grid-cols-5 gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl sans" style={{ background: active ? BLUSH : "transparent" }}>
                <Icon size={16} style={{ color: active ? ROSE : MUTE }} />
                <span className="text-[9px]" style={{ color: active ? ROSE : MUTE }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
