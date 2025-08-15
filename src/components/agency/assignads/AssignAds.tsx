// frontend: AssignTimeSlotForm.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/datepicker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface Client {
  id: string;
  businessName: string;
}
interface Device {
  id: string;
  name: string;
}
interface Ad {
  id: string;
  title: string;
}

export default function AssignTimeSlotForm() {
  const [clients, setClients] = useState<Client[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);

  const [clientId, setClientId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [adId, setAdId] = useState("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const [loadingForm, setLoadingForm] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [bookedSlots, setBookedSlots] = useState<Record<string, boolean[]>>({});
  const [selRanges, setSelRanges] = useState<
    Record<string, [number, number] | null>
  >({});

  // Load form data
  useEffect(() => {
    fetch("/api/assignments/form-data")
      .then((r) => r.json())
      .then((d) => {
        setClients(d.clients);
        setDevices(d.devices);
        setAds(d.ads);
        setLoadingForm(false);
      })
      .catch(() => {
        toast.error("Failed to load form data.");
        setLoadingForm(false);
      });
  }, []);

  // Load booked slots for selected dates
  useEffect(() => {
    if (deviceId && selectedDates.length > 0) {
      selectedDates.forEach((date) => {
        if (isDateInPast(date)) {
          toast.error("Cannot select past dates");
          setSelectedDates((prev) => prev.filter((d) => d !== date));
          return;
        }
        const ds = date.toISOString().slice(0, 10);
        fetch(`/api/assignments/slots?deviceId=${deviceId}&date=${ds}`)
          .then((r) => r.json())
          .then(({ bookedSlots }: { bookedSlots: boolean[] }) => {
            setBookedSlots((prev) => ({ ...prev, [ds]: bookedSlots }));
            setSelRanges((prev) => ({ ...prev, [ds]: null }));
          })
          .catch(() => toast.error("Failed to load booked slots"));
      });
    }
  }, [deviceId, selectedDates]);

  // Helper functions
  function isDateToday(date: Date) {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  function isDateInPast(date: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  function isDatePastHour(date: Date, hour: number) {
    if (isDateInPast(date)) return true;
    if (isDateToday(date)) {
      const now = new Date();
      return hour < now.getHours();
    }
    return false;
  }

  const handleClick = (date: Date, h: number) => {
    const ds = date.toISOString().slice(0, 10);
    if (!date || isDatePastHour(date, h) || bookedSlots[ds]?.[h]) return;

    const selRange = selRanges[ds];
    if (!selRange) {
      setSelRanges((prev) => ({ ...prev, [ds]: [h, h] }));
    } else {
      const [start, end] = selRange;
      if (h === end + 1)
        setSelRanges((prev) => ({ ...prev, [ds]: [start, h] }));
      else if (h === start - 1)
        setSelRanges((prev) => ({ ...prev, [ds]: [h, end] }));
      else setSelRanges((prev) => ({ ...prev, [ds]: [h, h] }));
    }
  };

  const handleSubmit = async () => {
    if (!clientId || !deviceId || !adId || selectedDates.length === 0) {
      toast.error("Please fill all fields and select dates/time slots");
      return;
    }

    const payload = {
      clientId,
      deviceId,
      adId,
      dates: selectedDates.map((d) => d.toISOString().slice(0, 10)),
      startTime: "",
      endTime: "",
    };

    // Validate selRanges: take earliest start & latest end across all dates
    const firstDate = selectedDates[0].toISOString().slice(0, 10);
    const range = selRanges[firstDate];
    if (!range) {
      toast.error("Please select time slots");
      return;
    }
    const [start, end] = range;
    payload.startTime = `${start.toString().padStart(2, "0")}:00:00`;
    payload.endTime = `${(end + 1).toString().padStart(2, "0")}:00:00`;

    setAssigning(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assignment failed");

      toast.success("Assigned successfully!");
      setSelRanges({});
      setBookedSlots({});
      setSelectedDates([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto p-4 bg-white rounded-md shadow-sm border">
      <h2 className="text-xl font-semibold text-center text-foreground">
        Assign Time Slots
      </h2>

      {loadingForm ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton className="h-11 w-full rounded-lg" key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Client */}
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ad */}
          <div className="space-y-2">
            <Label>Ad</Label>
            <Select value={adId} onValueChange={setAdId}>
              <SelectTrigger>
                <SelectValue placeholder="Select ad" />
              </SelectTrigger>
              <SelectContent>
                {ads.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Device */}
          <div className="space-y-2">
            <Label>Device</Label>
            <Select value={deviceId} onValueChange={setDeviceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select device" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <Label>Select Dates</Label>
            <DatePicker
              value={null}
              onChange={(d: Date | null) => {
                if (
                  d &&
                  !selectedDates.find(
                    (sd) => sd.toDateString() === d.toDateString()
                  )
                ) {
                  setSelectedDates([...selectedDates, d]);
                }
              }}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedDates.map((d, idx) => (
                <span
                  key={idx}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded"
                >
                  {d.toDateString()}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDates(selectedDates.filter((sd) => sd !== d))
                    }
                    className="ml-1 text-red-500 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDates.map((date) => {
            const ds = date.toISOString().slice(0, 10);
            const booked = bookedSlots[ds] ?? Array(24).fill(false);
            const [start, end] = selRanges[ds] ?? [-1, -1];

            return (
              <div key={ds} className="space-y-2">
                <Label>Time Slots for {ds}</Label>
                <div className="grid grid-cols-6 gap-2">
                  {hours.map((h) => {
                    const disabled =
                      !deviceId || isDatePastHour(date, h) || booked[h];
                    const isSelected = h >= start && h <= end;
                    return (
                      <button
                        key={h}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleClick(date, h)}
                        className={`p-2 rounded text-center text-sm font-medium transition ${
                          disabled
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-muted hover:bg-accent"
                        }`}
                      >
                        {h === 0
                          ? "12 AM"
                          : h < 12
                          ? `${h} AM`
                          : h === 12
                          ? "12 PM"
                          : `${h - 12} PM`}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Submit */}
          <Button onClick={handleSubmit} disabled={assigning}>
            {assigning ? "Assigning..." : "Assign Slots"}
          </Button>
        </>
      )}
    </div>
  );
}
