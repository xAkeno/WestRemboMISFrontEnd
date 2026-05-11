import axios from "axios";
import { Layout } from "@/components/Layout";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const SERVICE_TYPES = [
    { type: "barangay_clearance",  label: "Barangay Clearance",  min: 0, max: 10_000.00 },
    { type: "business_clearance",  label: "Business Clearance",  min: 0, max: 10_000.00 },
    { type: "building_clearance",  label: "Building Clearance",  min: 0, max: 100_000_000.00 },
    { type: "certificate",         label: "Barangay Certificate", min: 0, max: 2_000.00 },
    { type: "resident",            label: "Resident",             min: 0, max: 10_000.00 },
];

const MAX_DECIMAL_PLACES = 2;

interface ServicePrice {
    type: string;
    label: string;
    amount: number;
    min: number;
    max: number;
}

interface ValidationError {
    [type: string]: string;
}

// Now accepts per-service min/max
const validateAmount = (value: string, label: string, min: number, max: number): string | null => {
    if (value === "" || value === null || value === undefined) {
        return `${label} fee is required.`;
    }

    const numeric = parseFloat(value);

    if (isNaN(numeric)) {
        return `${label} fee must be a valid number.`;
    }

    if (numeric < min) {
        return `${label} fee cannot be negative.`;
    }

    if (numeric > max) {
        return `${label} fee cannot exceed ₱${max.toLocaleString()}.`;
    }

    const decimalPart = value.split(".")[1];
    if (decimalPart && decimalPart.length > MAX_DECIMAL_PLACES) {
        return `${label} fee must have at most 2 decimal places.`;
    }

    return null;
};

const formatAmount = (value: number | string): string => parseFloat(String(value)).toFixed(2);

const ServicePricing = () => {
    const [prices, setPrices] = useState<ServicePrice[]>(
        SERVICE_TYPES.map((s) => ({ ...s, amount: 0 }))
    );
    const [rawInputs, setRawInputs] = useState<{ [type: string]: string }>(
        Object.fromEntries(SERVICE_TYPES.map((s) => [s.type, "0.00"]))
    );
    const [errors, setErrors] = useState<ValidationError>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_WEB_URL_WITH_API}/service-prices`, {
                    withCredentials: true,
                });

                const data: { type: string; amount: number }[] = res.data?.data ?? res.data ?? [];

                setPrices((prev) =>
                    prev.map((s) => {
                        const match = data.find((d) => d.type === s.type);
                        return match ? { ...s, amount: parseFloat(String(match.amount)) } : s;
                    })
                );

                setRawInputs((prev) => {
                    const updated = { ...prev };
                    data.forEach((d) => {
                        updated[d.type] = formatAmount(d.amount); // formatAmount now handles strings too
                    });
                    return updated;
                });
            } catch (err) {
                console.error("Failed to load service prices:", err);
                toast.error("Failed to load service prices.");
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();
    }, []);

    const handleAmountChange = (type: string, value: string, label: string, min: number, max: number) => {
        setRawInputs((prev) => ({ ...prev, [type]: value }));

        const error = validateAmount(value, label, min, max);
        setErrors((prev) => ({ ...prev, [type]: error ?? "" }));

        if (!error) {
            const numeric = parseFloat(value);
            setPrices((prev) =>
                prev.map((s) =>
                    s.type === type ? { ...s, amount: isNaN(numeric) ? 0 : numeric } : s
                )
            );
        }
    };

    // Reformat to X.XX on blur so .00 is never erased
    const handleBlur = (type: string, label: string, min: number, max: number) => {
        const raw = rawInputs[type];
        const numeric = parseFloat(raw);

        if (!isNaN(numeric) && !validateAmount(raw, label, min, max)) {
            const formatted = formatAmount(numeric);
            setRawInputs((prev) => ({ ...prev, [type]: formatted }));
            setPrices((prev) =>
                prev.map((s) => (s.type === type ? { ...s, amount: numeric } : s))
            );
        } else if (raw === "" || isNaN(numeric)) {
            // Reset to 0.00 if left blank or non-numeric
            setRawInputs((prev) => ({ ...prev, [type]: "0.00" }));
            setPrices((prev) =>
                prev.map((s) => (s.type === type ? { ...s, amount: 0 } : s))
            );
            setErrors((prev) => ({ ...prev, [type]: "" }));
        }
    };

    // Strip .00 on focus so user doesn't have to manually clear it
    const handleFocus = (type: string) => {
        setRawInputs((prev) => {
            const current = prev[type];
            const stripped = current.endsWith(".00") ? current.slice(0, -3) : current;
            return { ...prev, [type]: stripped === "0" ? "" : stripped };
        });
    };

    const handleSave = async (service: ServicePrice) => {
        const rawValue = rawInputs[service.type];
        const error = validateAmount(rawValue, service.label, service.min, service.max);

        if (error) {
            setErrors((prev) => ({ ...prev, [service.type]: error }));
            toast.error(error);
            return;
        }

        setSaving((prev) => new Set(prev).add(service.type));
        try {
            await axios.put(
                `${import.meta.env.VITE_WEB_URL_WITH_API}/service-prices/${service.type}`,
                { amount: service.amount },
                { withCredentials: true }
            );
            toast.success(`${service.label} fee updated to ₱${formatAmount(service.amount)}`);
        } catch (err: any) {
            console.error("Failed to save price:", err);
            toast.error(err?.response?.data?.message ?? `Failed to update ${service.label} fee.`);
        } finally {
            setSaving((prev) => {
                const next = new Set(prev);
                next.delete(service.type);
                return next;
            });
        }
    };

    const handleSaveAll = async () => {
        const allErrors: ValidationError = {};
        let hasErrors = false;

        for (const service of prices) {
            const rawValue = rawInputs[service.type];
            const error = validateAmount(rawValue, service.label, service.min, service.max);
            if (error) {
                allErrors[service.type] = error;
                hasErrors = true;
            }
        }

        if (hasErrors) {
            setErrors(allErrors);
            toast.error("Please fix all errors before saving.");
            return;
        }

        for (const service of prices) {
            await handleSave(service);
        }
    };

    const hasAnyError = Object.values(errors).some(Boolean);

    return (
        <Layout>
            <div className="w-full max-w-2xl mx-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-heading">Service Fee Settings</h2>
                    <p className="text-sm text-body mt-1">
                        Set the official receipt amount for each document type. These amounts will be used when generating OR numbers.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <svg className="w-6 h-6 animate-spin text-body" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span className="ml-2 text-sm text-body">Loading prices...</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {prices.map((service) => {
                            const error = errors[service.type];
                            const hasError = Boolean(error);

                            return (
                                <div key={service.type} className="flex flex-col gap-1">
                                    <div
                                        className={`flex items-center justify-between gap-4 p-4 bg-neutral-secondary-medium border rounded-base transition-colors ${
                                            hasError ? "border-red-400 bg-red-50" : "border-default-medium"
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-heading">{service.label}</p>
                                            <p className="text-xs text-body mt-0.5 font-mono">{service.type}</p>
                                            <p className="text-xs text-body mt-0.5 opacity-60">
                                                Max: ₱{service.max.toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-sm text-body pointer-events-none">
                                                    ₱
                                                </span>
                                                <input
                                                    type="number"
                                                    min={service.min}
                                                    max={service.max}
                                                    step="0.01"
                                                    className={`pl-6 pr-3 py-1.5 border rounded text-sm text-heading w-36 text-right transition-colors ${
                                                        hasError
                                                            ? "border-red-400 bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-400"
                                                            : "border-default-medium bg-neutral-primary-soft focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                    }`}
                                                    value={rawInputs[service.type]}
                                                    onChange={(e) =>
                                                        handleAmountChange(service.type, e.target.value, service.label, service.min, service.max)
                                                    }
                                                    onFocus={() => handleFocus(service.type)}
                                                    onBlur={() => handleBlur(service.type, service.label, service.min, service.max)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleSave(service);
                                                    }}
                                                />
                                            </div>

                                            <button
                                                onClick={() => handleSave(service)}
                                                disabled={saving.has(service.type) || hasError}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed rounded transition-colors"
                                            >
                                                {saving.has(service.type) ? (
                                                    <>
                                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                        </svg>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                                            <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L19 7" />
                                                        </svg>
                                                        Save
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {hasError && (
                                        <p className="text-xs text-red-500 flex items-center gap-1 pl-1">
                                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
                                                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                            </svg>
                                            {error}
                                        </p>
                                    )}
                                </div>
                            );
                        })}

                        <button
                            onClick={handleSaveAll}
                            disabled={saving.size > 0 || hasAnyError}
                            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed rounded transition-colors"
                        >
                            {saving.size > 0 ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Saving All...
                                </>
                            ) : (
                                "Save All Prices"
                            )}
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ServicePricing;