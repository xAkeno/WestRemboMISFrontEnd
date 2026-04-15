import { useState, useEffect } from "react";
import axios from "axios";
import { Layout } from '@/components/Layout';
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  withCredentials: true,
});

const SETTING_META = {
  maintenance_mode: {
    label: "Maintenance Mode",
    type: "toggle",
    icon: "🔧",
    description: "Temporarily disable the site for visitors",
    group: "System",
  },
  maintenance_message: {
    label: "Maintenance Message",
    type: "text",
    icon: "💬",
    description: "Message shown during maintenance",
    group: "System",
  },
  vacation_mode: {
    label: "Vacation Mode",
    type: "toggle",
    icon: "🌴",
    description: "Pause operations while you're away",
    group: "Vacation",
  },
  vacation_start: {
    label: "Vacation Start",
    type: "date",
    icon: "📅",
    description: "First day of vacation",
    group: "Vacation",
  },
  vacation_end: {
    label: "Vacation End",
    type: "date",
    icon: "📅",
    description: "Last day of vacation",
    group: "Vacation",
  },
};

function Toggle({ value, onChange }) {
  const active = value === "true" || value === true;
  return (
    <button
      onClick={() => onChange(active ? "false" : "true")}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none ${
        active ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
          active ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function StatusBadge({ active, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold tracking-wide ${
        active
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500 animate-pulse" : "bg-zinc-400 dark:bg-zinc-600"
        }`}
      />
      {label}
    </span>
  );
}

function SettingRow({ settingKey, value, onChange, isEdited }) {
  const meta = SETTING_META[settingKey] || {
    label: settingKey,
    type: "text",
    icon: "⚙️",
    description: "",
    group: "Other",
  };

  return (
    <div
      className={`group relative flex items-center justify-between gap-6 rounded-2xl border px-5 py-4 transition-all duration-200 ${
        isEdited
          ? "border-amber-200 bg-amber-50/50 dark:border-amber-500/40 dark:bg-amber-500/5"
          : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg dark:bg-white/5">
          {meta.icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{meta.label}</p>
            {isEdited && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider dark:bg-amber-500/20 dark:text-amber-400">
                Modified
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {meta.description || settingKey}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {meta.type === "toggle" ? (
          <div className="flex items-center gap-3">
            <StatusBadge
              active={value === "true" || value === true}
              label={value === "true" || value === true ? "Enabled" : "Disabled"}
            />
            <Toggle value={value} onChange={(v) => onChange(settingKey, v)} />
          </div>
        ) : (
          <input
            type={meta.type === "date" ? "date" : "text"}
            value={value || ""}
            onChange={(e) => onChange(settingKey, e.target.value)}
            className="w-64 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-indigo-500/60"
          />
        )}
      </div>
    </div>
  );
}

export default function WebsiteSettings() {
  const [settings, setSettings] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/settings/");
      setSettings(data);
      setOriginal(data);
    } catch (err) {
      showToast("error", "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post("/settings/update", settings);
      setOriginal({ ...settings });
      showToast("success", "Settings saved successfully");
    } catch {
      showToast("error", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setSettings({ ...original });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const editedKeys = Object.keys(settings).filter(
    (k) => settings[k] !== original[k]
  );
  const hasChanges = editedKeys.length > 0;

  const groups = {};
  Object.entries(settings).forEach(([key, value]) => {
    const g = SETTING_META[key]?.group || "Other";
    if (!groups[g]) groups[g] = [];
    groups[g].push({ key, value });
  });

  return (
    <Layout>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-[#09090b] dark:text-zinc-100">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed right-5 top-5 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-all duration-500 ${
              toast.type === "success"
                ? "border-emerald-200 bg-white/90 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "border-red-200 bg-white/90 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            }`}
          >
            <span>{toast.type === "success" ? "✓" : "✕"}</span>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        )}

        <div className="mx-auto max-w-3xl px-6 py-12">
          {/* Header */}
          <div className="mb-10 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 border border-indigo-200 text-2xl dark:bg-indigo-500/10 dark:border-indigo-500/20">
              ⚙️
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                Admin System
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Website Settings
              </h1>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/20 border-t-indigo-600" />
              <p className="text-sm text-zinc-500">Syncing with server...</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      {group}
                    </h2>
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-white/5" />
                  </div>
                  <div className="grid gap-3">
                    {items.map(({ key, value }) => (
                      <SettingRow
                        key={key}
                        settingKey={key}
                        value={value}
                        onChange={handleChange}
                        isEdited={settings[key] !== original[key]}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Floating Action Bar */}
              <div
                className={`sticky bottom-6 flex items-center justify-between rounded-2xl border p-4 backdrop-blur-md transition-all duration-500 ${
                  hasChanges
                    ? "border-amber-200 bg-white/90 shadow-2xl dark:border-amber-500/30 dark:bg-zinc-900/80"
                    : "border-zinc-200 bg-white/50 dark:border-white/5 dark:bg-zinc-900/40"
                }`}
              >
                <div className="flex items-center gap-3 px-2">
                  <div className={`h-2 w-2 rounded-full ${hasChanges ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {hasChanges ? (
                      <span><b className="text-amber-600 dark:text-amber-400">{editedKeys.length}</b> pending changes</span>
                    ) : (
                      "Settings up to date"
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {hasChanges && (
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors dark:text-zinc-400 dark:hover:text-white"
                    >
                      Discard
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
                      hasChanges && !saving
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-500"
                    }`}
                  >
                    {saving ? "Saving..." : "Save Changes"}
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