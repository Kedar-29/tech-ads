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
  const [date, setDate] = useState<Date | null>(null);

  const [loadingForm, setLoadingForm] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [booked, setBooked] = useState<boolean[]>(Array(24).fill(false));
  const [selRange, setSelRange] = useState<[number, number] | null>(null);

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

  useEffect(() => {
    if (deviceId && date) {
      if (isDateInPast(date)) {
        toast.error("Cannot select past dates");
        setDate(null);
        resetSelection();
        return;
      }

      const ds = date.toISOString().slice(0, 10);
      fetch(`/api/assignments/slots?deviceId=${deviceId}&date=${ds}`)
        .then((r) => r.json())
        .then(({ bookedSlots }: { bookedSlots: boolean[] }) => {
          setBooked(bookedSlots);
          setSelRange(null);
        })
        .catch(() => toast.error("Failed to load booked slots"));
    } else {
      resetSelection();
    }
  }, [deviceId, date]);

  function isDateToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  function isDateInPast(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  function isDatePastHour(date: Date, hour: number): boolean {
    if (isDateInPast(date)) return true;
    if (isDateToday(date)) {
      const now = new Date();
      return hour < now.getHours();
    }
    return false;
  }

  function resetSelection() {
    setBooked(Array(24).fill(false));
    setSelRange(null);
  }

  const handleClick = (h: number) => {
    if (!date || isDatePastHour(date, h) || booked[h]) return;

    if (!selRange) {
      setSelRange([h, h]);
    } else {
      const [start, end] = selRange;
      if (h === end + 1) setSelRange([start, h]);
      else if (h === start - 1) setSelRange([h, end]);
      else setSelRange([h, h]);
    }
  };

  const handleSubmit = async () => {
    if (!clientId || !deviceId || !adId || !date || !selRange) {
      toast.error("Please fill all fields and select time slot");
      return;
    }

    const [start, end] = selRange;

    const startTime = new Date(date);
    startTime.setHours(start, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(end + 1, 0, 0, 0);

    // Handle overnight
    if (end + 1 <= start) endTime.setDate(endTime.getDate() + 1);

    setAssigning(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          deviceId,
          adId,
          date: date.toISOString().slice(0, 10),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Assigned successfully!");

      setSelRange(null);
      setBooked((prev) =>
        prev.map((b, i) =>
          start <= end
            ? i >= start && i <= end
            : i >= start || i <= end
            ? true
            : b
        )
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const handlePlayNow = async () => {
    if (!clientId || !deviceId || !adId || !date) {
      toast.error("Please fill all fields first");
      return;
    }

    const hour = new Date().getHours();

    if (isDateToday(date) && booked[hour]) {
      toast.error("Current hour already booked.");
      return;
    }

    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(hour + 1, 0, 0, 0);
    if (hour === 23) {
      endTime.setDate(endTime.getDate() + 1);
      endTime.setHours(0);
    }

    setAssigning(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          deviceId,
          adId,
          date: date.toISOString().slice(0, 10),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Assigned to current slot successfully");
      setBooked((prev) => prev.map((b, i) => (i === hour ? true : b)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto p-4 bg-white rounded-md shadow-sm border">
      <h2 className="text-xl font-semibold text-center text-foreground">
        Assign Time Slot
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

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <DatePicker value={date} onChange={(d) => setDate(d)} />
          </div>

          {/* Time Slots */}
          <div className="space-y-2">
            <Label>Time Slots</Label>
            <div className="grid grid-cols-6 gap-2">
              {hours.map((h) => {
                const disabled = !date || isDatePastHour(date, h) || booked[h];
                const [start, end] = selRange ?? [-1, -1];
                const isSelected = h >= start && h <= end;

                return (
                  <button
                    key={h}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleClick(h)}
                    title={
                      isDatePastHour(date!, h)
                        ? "Past time"
                        : booked[h]
                        ? "Already booked"
                        : "Click to select"
                    }
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

            <div className="text-xs text-muted-foreground mt-1 flex gap-6">
              <div>
                <span className="inline-block w-3 h-3 bg-blue-600 mr-1 rounded-sm" />{" "}
                Selected
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-gray-300 mr-1 rounded-sm" />{" "}
                Disabled
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-between">
            <Button onClick={handleSubmit} disabled={assigning || !selRange}>
              {assigning ? "Assigning..." : "Assign Slot"}
            </Button>
            <Button
              variant="outline"
              onClick={handlePlayNow}
              disabled={assigning || !date}
            >
              {assigning ? "Assigning..." : "Assign Now"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
