import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Layout } from "@/components/Layout";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_WEB_URL}/api`,
  withCredentials: true,
});

// ─── Philippine Holidays ─────────────────────────────────────────────────────

const PH_HOLIDAYS = [
  // Regular
  { label: "New Year's Day",                    value: "New Year's Day",                   type: "Regular" },
  { label: "Araw ng Kagitingan (Day of Valor)",  value: "Araw ng Kagitingan",               type: "Regular" },
  { label: "Maundy Thursday",                   value: "Maundy Thursday",                  type: "Regular" },
  { label: "Good Friday",                       value: "Good Friday",                      type: "Regular" },
  { label: "Black Saturday",                    value: "Black Saturday",                   type: "Regular" },
  { label: "Labor Day",                         value: "Labor Day",                        type: "Regular" },
  { label: "Independence Day",                  value: "Independence Day",                 type: "Regular" },
  { label: "National Heroes Day",               value: "National Heroes Day",              type: "Regular" },
  { label: "Bonifacio Day",                     value: "Bonifacio Day",                    type: "Regular" },
  { label: "Christmas Day",                     value: "Christmas Day",                    type: "Regular" },
  { label: "Rizal Day",                         value: "Rizal Day",                        type: "Regular" },
  // Special Non-Working
  { label: "Chinese New Year",                  value: "Chinese New Year",                 type: "Special" },
  { label: "EDSA People Power Anniversary",     value: "EDSA People Power Anniversary",    type: "Special" },
  { label: "Holy Monday",                       value: "Holy Monday",                      type: "Special" },
  { label: "Holy Tuesday",                      value: "Holy Tuesday",                     type: "Special" },
  { label: "Holy Wednesday",                    value: "Holy Wednesday",                   type: "Special" },
  { label: "Easter Sunday",                     value: "Easter Sunday",                    type: "Special" },
  { label: "Eid'l Fitr (Feast of Ramadhan)",    value: "Eid'l Fitr",                       type: "Special" },
  { label: "Eid'l Adha (Feast of Sacrifice)",   value: "Eid'l Adha",                       type: "Special" },
  { label: "Ninoy Aquino Day",                  value: "Ninoy Aquino Day",                 type: "Special" },
  { label: "All Saints' Day",                   value: "All Saints' Day",                  type: "Special" },
  { label: "All Souls' Day",                    value: "All Souls' Day",                   type: "Special" },
  { label: "Christmas Eve",                     value: "Christmas Eve",                    type: "Special" },
  { label: "New Year's Eve",                    value: "New Year's Eve",                   type: "Special" },
  // Office / Others
  { label: "Summer Vacation",                   value: "Summer Vacation",                  type: "Office"  },
  { label: "Semestral Break",                   value: "Semestral Break",                  type: "Office"  },
  { label: "Office Anniversary",                value: "Office Anniversary",               type: "Office"  },
  { label: "Typhoon / Calamity",                value: "Typhoon / Calamity",               type: "Office"  },
  { label: "Others (type manually…)",           value: "__custom__",                       type: "Office"  },
];

const TYPE_BADGE = {
  Regular: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  Special: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  Office:  "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
};

const TYPE_EMOJI = { Regular: "🇵🇭", Special: "✨", Office: "🏢" };
const TYPE_ORDER = ["Regular", "Special", "Office"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const newVacation = () => ({
  id: crypto.randomUUID(),
  name: "",
  start: "",
  end: "",
  active: false,
});

// ─── HolidayCombobox ─────────────────────────────────────────────────────────

function HolidayCombobox({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const isPreset = PH_HOLIDAYS.some(
      (h) => h.value !== "__custom__" && h.value === value
    );
    setIsCustom(!!value && !isPreset);
  }, []); // eslint-disable-line

  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const selectedPreset = PH_HOLIDAYS.find(
    (h) => h.value !== "__custom__" && h.value === value
  );

  const filtered = PH_HOLIDAYS.filter((h) =>
    h.label.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = filtered.reduce((acc, h) => {
    if (!acc[h.type]) acc[h.type] = [];
    acc[h.type].push(h);
    return acc;
  }, {});

  const handleSelect = (h) => {
    if (h.value === "__custom__") {
      setIsCustom(true);
      onChange("");
      setOpen(false);
      setQuery("");
    } else {
      setIsCustom(false);
      onChange(h.value);
      setOpen(false);
      setQuery("");
    }
  };

  if (isCustom) {
    return (
      <div className="flex flex-1 items-center gap-2">
        <input
          type="text"
          autoFocus
          placeholder="Type holiday / vacation name…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-xl border border-indigo-300 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 placeholder:font-normal placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-indigo-500/40 dark:bg-zinc-900 dark:text-zinc-200"
        />
        <button
          type="button"
          title="Back to list"
          onClick={() => { setIsCustom(false); onChange(""); }}
          className="shrink-0 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-300 hover:text-zinc-700 dark:border-white/10 dark:hover:text-zinc-200"
        >
          ↩ List
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setQuery(""); }}
        className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-left transition-all focus:outline-none ${
          open
            ? "border-indigo-400 ring-2 ring-indigo-500/20 bg-white dark:bg-zinc-900"
            : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-900"
        }`}
      >
        <span className={`flex-1 truncate ${selectedPreset ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}`}>
          {selectedPreset ? selectedPreset.label : "Select a holiday…"}
        </span>
        {selectedPreset && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${TYPE_BADGE[selectedPreset.type]}`}>
            {selectedPreset.type}
          </span>
        )}
        <svg
          className={`shrink-0 h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900">
          <div className="p-2 border-b border-zinc-100 dark:border-white/5">
            <input
              autoFocus
              type="text"
              placeholder="Search holidays…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs focus:border-indigo-400 focus:outline-none dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {TYPE_ORDER.map((type) => {
              const items = grouped[type];
              if (!items || items.length === 0) return null;
              return (
                <div key={type}>
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    {TYPE_EMOJI[type]}&nbsp;
                    {type === "Regular" ? "Regular Holidays" : type === "Special" ? "Special Non-Working" : "Office / Others"}
                  </div>
                  {items.map((h) => (
                    <button
                      key={h.value}
                      type="button"
                      onClick={() => handleSelect(h)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-left hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <span className={h.value === "__custom__" ? "italic font-semibold text-indigo-600 dark:text-indigo-400" : "text-zinc-800 dark:text-zinc-200"}>
                        {h.label}
                      </span>
                      {h.value !== "__custom__" && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${TYPE_BADGE[type]}`}>
                          {type}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-zinc-400">
                No matches — scroll to "Others" to type manually
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Toggle / Badge ───────────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  const active = value === "true" || value === true;
  return (
    <button
      onClick={() => onChange(active ? "false" : "true")}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none ${
        active ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
      }`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${active ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function StatusBadge({ active, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold tracking-wide ${active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500 animate-pulse" : "bg-zinc-400 dark:bg-zinc-600"}`} />
      {label}
    </span>
  );
}

// ─── VacationCard ─────────────────────────────────────────────────────────────

function VacationCard({ vacation, onChange, onRemove }) {
  const handle = (field) => (e) => onChange({ ...vacation, [field]: e.target.value });
  const handleToggle = (val) => onChange({ ...vacation, active: val === "true" });
  const handleName = (name) => onChange({ ...vacation, name });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4 dark:border-white/8 dark:bg-white/[0.03] transition-all duration-200 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-lg shrink-0">🗓️</span>
        <HolidayCombobox value={vacation.name} onChange={handleName} />
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge active={vacation.active} label={vacation.active ? "Active" : "Inactive"} />
          <Toggle value={vacation.active ? "true" : "false"} onChange={handleToggle} />
        </div>
        <button
          onClick={onRemove}
          title="Remove"
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[["start", "Start Date"], ["end", "End Date"]].map(([field, lbl]) => (
          <div key={field} className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{lbl}</label>
            <input
              type="date"
              value={vacation[field]}
              onChange={handle(field)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SettingRow ───────────────────────────────────────────────────────────────

const SYSTEM_META = {
  maintenance_mode:    { label: "Maintenance Mode",    type: "toggle", icon: "🔧", description: "Temporarily disable the site for visitors" },
  maintenance_message: { label: "Maintenance Message", type: "text",   icon: "💬", description: "Message shown during maintenance" },
};

function SettingRow({ settingKey, value, onChange, isEdited }) {
  const meta = SYSTEM_META[settingKey] || { label: settingKey, type: "text", icon: "⚙️", description: "" };
  return (
    <div className={`group relative flex items-center justify-between gap-6 rounded-2xl border px-5 py-4 transition-all duration-200 ${isEdited ? "border-amber-200 bg-amber-50/50 dark:border-amber-500/40 dark:bg-amber-500/5" : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"}`}>
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg dark:bg-white/5">{meta.icon}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{meta.label}</p>
            {isEdited && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider dark:bg-amber-500/20 dark:text-amber-400">Modified</span>}
          </div>
          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{meta.description || settingKey}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {meta.type === "toggle" ? (
          <div className="flex items-center gap-3">
            <StatusBadge active={value === "true" || value === true} label={value === "true" || value === true ? "Enabled" : "Disabled"} />
            <Toggle value={value} onChange={(v) => onChange(settingKey, v)} />
          </div>
        ) : (
          <input type="text" value={value || ""} onChange={(e) => onChange(settingKey, e.target.value)}
            className="w-64 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
          />
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WebsiteSettings() {
  const [settings, setSettings] = useState({});
  const [original, setOriginal] = useState({});
  const [vacations, setVacations] = useState([]);
  const [originalVacations, setOriginalVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/settings/");
      const { vacations: vacRaw, ...rest } = data;
      const parsed = vacRaw ? JSON.parse(vacRaw) : [];
      setSettings(rest); setOriginal(rest);
      setVacations(parsed); setOriginalVacations(parsed);
    } catch { showToast("error", "Failed to load settings"); }
    finally { setLoading(false); }
  };

  const handleChange = (key, value) => setSettings((p) => ({ ...p, [key]: value }));
  const addVacation = () => setVacations((p) => [...p, newVacation()]);
  const updateVacation = (id, updated) => setVacations((p) => p.map((v) => v.id === id ? updated : v));
  const removeVacation = (id) => setVacations((p) => p.filter((v) => v.id !== id));

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post("/settings/update", { ...settings, vacations: JSON.stringify(vacations) });
      setOriginal({ ...settings });
      setOriginalVacations(JSON.parse(JSON.stringify(vacations)));
      showToast("success", "Settings saved successfully");
    } catch { showToast("error", "Failed to save settings"); }
    finally { setSaving(false); }
  };

  const handleReset = () => {
    setSettings({ ...original });
    setVacations(JSON.parse(JSON.stringify(originalVacations)));
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const settingsChanged = Object.keys(settings).some((k) => settings[k] !== original[k]);
  const vacationsChanged = JSON.stringify(vacations) !== JSON.stringify(originalVacations);
  const hasChanges = settingsChanged || vacationsChanged;
  const editedCount = Object.keys(settings).filter((k) => settings[k] !== original[k]).length + (vacationsChanged ? 1 : 0);
  const systemKeys = Object.keys(settings).filter((k) => k in SYSTEM_META);

  return (
    <Layout>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-[#09090b] dark:text-zinc-100">
        {toast && (
          <div className={`fixed right-5 top-5 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-all duration-500 ${toast.type === "success" ? "border-emerald-200 bg-white/90 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400" : "border-red-200 bg-white/90 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"}`}>
            <span>{toast.type === "success" ? "✓" : "✕"}</span>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        )}

        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="mb-10 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 border border-indigo-200 text-2xl dark:bg-indigo-500/10 dark:border-indigo-500/20">⚙️</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Admin System</p>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Website Settings</h1>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/20 border-t-indigo-600" />
              <p className="text-sm text-zinc-500">Syncing with server…</p>
            </div>
          ) : (
            <div className="space-y-10">
              {systemKeys.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">System</h2>
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-white/5" />
                  </div>
                  <div className="grid gap-3">
                    {systemKeys.map((key) => (
                      <SettingRow key={key} settingKey={key} value={settings[key]} onChange={handleChange} isEdited={settings[key] !== original[key]} />
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Vacations &amp; Holidays</h2>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-white/5" />
                  <button
                    onClick={addVacation}
                    className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                  >
                    + Add
                  </button>
                </div>

                {vacations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-10 text-center dark:border-white/8">
                    <span className="text-3xl mb-2">🌴</span>
                    <p className="text-sm font-medium text-zinc-500">No vacations or holidays yet</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Click <b>+ Add</b> to create one</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {vacations.map((v) => (
                      <VacationCard key={v.id} vacation={v} onChange={(u) => updateVacation(v.id, u)} onRemove={() => removeVacation(v.id)} />
                    ))}
                  </div>
                )}
              </section>

              <div className={`sticky bottom-6 flex items-center justify-between rounded-2xl border p-4 backdrop-blur-md transition-all duration-500 ${hasChanges ? "border-amber-200 bg-white/90 shadow-2xl dark:border-amber-500/30 dark:bg-zinc-900/80" : "border-zinc-200 bg-white/50 dark:border-white/5 dark:bg-zinc-900/40"}`}>
                <div className="flex items-center gap-3 px-2">
                  <div className={`h-2 w-2 rounded-full ${hasChanges ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {hasChanges
                      ? <span><b className="text-amber-600 dark:text-amber-400">{editedCount}</b> pending {editedCount === 1 ? "change" : "changes"}</span>
                      : "Settings up to date"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {hasChanges && (
                    <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors dark:text-zinc-400 dark:hover:text-white">
                      Discard
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${hasChanges && !saving ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20" : "bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-500"}`}
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}