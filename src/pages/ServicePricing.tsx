import axios from "axios";
import { Layout } from "@/components/Layout";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const SERVICE_TYPES = [
    { type: "barangay_clearance", label: "Barangay Clearance" },
    { type: "business_clearance", label: "Business Clearance" },
    { type: "building_clearance", label: "Building Clearance" },
    { type: "certificate", label: "Barangay Certificate" },
    { type: "resident", label: "Resident" },
];

interface ServicePrice {
    type: string;
    label: string;  
    amount: number;
}

const ServicePricing = () => {
    const [prices, setPrices] = useState<ServicePrice[]>(
        SERVICE_TYPES.map((s) => ({ ...s, amount: 0 }))
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Set<string>>(new Set());

    // Load existing prices from backend on mount
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await axios.get("http://127.0.0.1:8000/api/service-prices", {
                    withCredentials: true,
                });

                console.log("Fetched service prices:", res.data); // Debug log

                // Expected: [{ type: "barangay_clearance", amount: 50 }, ...]
                const data: { type: string; amount: number }[] = res.data?.data ?? res.data ?? [];

                setPrices((prev) =>
                    prev.map((s) => {
                        const match = data.find((d) => d.type === s.type);
                        return match ? { ...s, amount: match.amount } : s;
                    })
                );
            } catch (err) {
                console.error("Failed to load service prices:", err);
                toast.error("Failed to load service prices.");
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();
    }, []);

    const handleAmountChange = (type: string, value: string) => {
        const numeric = parseFloat(value);
        setPrices((prev) =>
            prev.map((s) =>
                s.type === type ? { ...s, amount: isNaN(numeric) ? 0 : numeric } : s
            )
        );
    };

    const handleSave = async (service: ServicePrice) => {
        setSaving((prev) => new Set(prev).add(service.type));
        try {
            const res = await axios.put(
                `http://127.0.0.1:8000/api/service-prices/${service.type}`,
                { amount: service.amount },
                { withCredentials: true }
            );
            console.log("Updated service price:", res.data); // Debug log

            toast.success(`${service.label} fee updated to ₱${service.amount.toFixed(2)}`);
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
        for (const service of prices) {
            await handleSave(service);
        }
    };

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
                        {prices.map((service) => (
                            <div
                                key={service.type}
                                className="flex items-center justify-between gap-4 p-4 bg-neutral-secondary-medium border border-default-medium rounded-base"
                            >
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-heading">{service.label}</p>
                                    <p className="text-xs text-body mt-0.5 font-mono">{service.type}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Amount input */}
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-sm text-body pointer-events-none">₱</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="pl-6 pr-3 py-1.5 border border-default-medium bg-neutral-primary-soft rounded text-sm text-heading w-32 text-right"
                                            value={service.amount}
                                            onChange={(e) => handleAmountChange(service.type, e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") handleSave(service); }}
                                        />
                                    </div>

                                    {/* Save button */}
                                    <button
                                        onClick={() => handleSave(service)}
                                        disabled={saving.has(service.type)}
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
                        ))}

                        {/* Save All */}
                        <button
                            onClick={handleSaveAll}
                            disabled={saving.size > 0}
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
