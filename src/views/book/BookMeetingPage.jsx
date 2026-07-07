'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, CalendarDays, Clock3 } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];
const MotionDiv = motion.div;

const CALENDAR_ID =
  'zz08011230966a69f6cf3661848a642f5bb3891b602ec3d013adfd5d004d1c52cbdb244ec514c600315637892b53e649a28e89876b';

const EVENT_REQUEST_BASE = `https://calendar.zoho.com/eventreq/${CALENDAR_ID}`;

const DEFAULT_FORM = {
  name: '',
  email: '',
  date: '',
  time: '11:00',
  reason: '',
};

const WEEKLY_WINDOWS = [
  { day: 'Mon', dayIndex: 1, windows: [{ label: '11:00 AM', value: '11:00' }, { label: '2:30 PM', value: '14:30' }] },
  { day: 'Tue', dayIndex: 2, windows: [{ label: '10:30 AM', value: '10:30' }, { label: '4:00 PM', value: '16:00' }] },
  { day: 'Wed', dayIndex: 3, windows: [{ label: '12:00 PM', value: '12:00' }, { label: '3:30 PM', value: '15:30' }] },
  { day: 'Thu', dayIndex: 4, windows: [{ label: '11:30 AM', value: '11:30' }, { label: '5:00 PM', value: '17:00' }] },
  { day: 'Fri', dayIndex: 5, windows: [{ label: '10:00 AM', value: '10:00' }, { label: '1:30 PM', value: '13:30' }] },
];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  };
}

function formatRequestDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${month}/${day}/${year}`;
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function nextDateForWeekday(dayIndex) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const delta = (dayIndex - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + delta);
  return toDateInputValue(date);
}

function CalendarPreview({ form, onSelectSlot }) {
  return (
    <div className="w-full flex flex-col overflow-hidden rounded-[2rem] bg-zinc-950 shadow-[0_0_40px_rgba(255,255,255,0.02)] sm:rounded-[2.5rem]">
      {/* Editorial top gradient border accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pxi-orange via-pxi-pink to-pxi-purple opacity-60" />
      
      <div className="flex items-center justify-between px-6 py-6 sm:px-8 sm:py-8">
        <div>
          <p className="text-sm font-bold tracking-wide text-white uppercase">Availability</p>
          <p className="mt-1 text-sm text-zinc-400">Tap a slot to start your reservation.</p>
        </div>
        <CalendarDays className="size-5 shrink-0 text-zinc-500" />
      </div>
      
      <div className="flex flex-col flex-1 bg-black p-4 sm:p-8">
        {/* Google Calendar style layout: Horizontal scroll on mobile, 5 cols on desktop */}
        <div className="flex sm:grid sm:grid-cols-5 gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar-open pb-4 sm:pb-0">
          {WEEKLY_WINDOWS.map((item) => {
            const slotDate = nextDateForWeekday(item.dayIndex);
            const dateNum = slotDate.split('-')[2];
            
            return (
              <div key={item.day} className="flex-none w-[140px] sm:w-auto snap-start">
                <div className="text-center mb-6">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{item.day}</p>
                  <p className="mt-2 text-2xl font-light text-zinc-300">{dateNum}</p>
                </div>
                
                <div className="space-y-1.5">
                  {item.windows.map((time) => {
                    const isSelected = form.date === slotDate && form.time === time.value;
                    return (
                      <button
                        key={time.value}
                        type="button"
                        onClick={() => onSelectSlot(item.dayIndex, time.value)}
                        className={[
                          'w-full flex items-start justify-start p-3 min-h-[64px] text-[13px] font-semibold transition-all duration-200 text-left',
                          // Google Calendar uses sharp squares and solid colors
                          'rounded-none',
                          isSelected
                            ? 'bg-pxi-purple text-white shadow-[0_0_20px_rgba(240,31,255,0.25)]'
                            : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white',
                        ].join(' ')}
                        aria-pressed={isSelected}
                        aria-label={`Prefer ${item.day} at ${time.label}`}
                      >
                        {time.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8">
          <p className="text-[13px] font-medium leading-relaxed text-zinc-500 text-center">
            These are preferred request windows, not live inventory.
          </p>
        </div>
      </div>
    </div>
  );
}

function SchedulerFrame({ form, setForm }) {
  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams({
      name: form.name,
      mailId: form.email,
      date: formatRequestDate(form.date),
      time: form.time,
      reason: form.reason || 'PXI booking request',
    });
    window.open(`${EVENT_REQUEST_BASE}?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="schedule" className="relative w-full flex flex-col scroll-mt-28 overflow-hidden rounded-[2rem] bg-zinc-950 shadow-[0_0_40px_rgba(255,255,255,0.02)] sm:rounded-[2.5rem]">
      <div className="flex items-center justify-between gap-4 px-6 py-6 sm:px-8 sm:py-8">
        <div>
          <p className="text-sm font-bold tracking-wide text-white uppercase">Reservation</p>
          <p className="mt-1 text-sm text-zinc-400">Fill in the details to complete your request.</p>
        </div>
      </div>

      <div className="relative flex flex-col flex-1 bg-black p-6 sm:px-8 sm:pb-8">
        <div className="absolute inset-x-6 top-0 h-px bg-white/5" aria-hidden />
        
        <form onSubmit={handleSubmit} className="flex h-full flex-col gap-6 pt-4">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2.5 text-sm font-semibold text-zinc-300">
              Name
              <input
                required
                value={form.name}
                onChange={updateField('name')}
                placeholder="First Last"
                className="h-14 rounded-none bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:bg-white/[0.08]"
              />
            </label>
            <label className="grid gap-2.5 text-sm font-semibold text-zinc-300">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={updateField('email')}
                placeholder="you@email.com"
                className="h-14 rounded-none bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:bg-white/[0.08]"
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2.5 text-sm font-semibold text-zinc-300">
              Date
              <input
                required
                type="date"
                value={form.date}
                onChange={updateField('date')}
                className="h-14 rounded-none bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none transition focus:bg-white/[0.08]"
              />
            </label>
            <label className="grid gap-2.5 text-sm font-semibold text-zinc-300">
              Time
              <select
                required
                value={form.time}
                onChange={updateField('time')}
                className="h-14 rounded-none bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none transition focus:bg-white/[0.08]"
              >
                <option value="10:00">10:00 AM</option>
                <option value="10:30">10:30 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="13:30">1:30 PM</option>
                <option value="14:30">2:30 PM</option>
                <option value="15:30">3:30 PM</option>
                <option value="16:00">4:00 PM</option>
                <option value="17:00">5:00 PM</option>
              </select>
            </label>
          </div>

          <label className="grid flex-1 gap-2.5 text-sm font-semibold text-zinc-300">
            What should we talk through?
            <textarea
              value={form.reason}
              onChange={updateField('reason')}
              placeholder="Tell us about the event, tickets, gallery, or rollout you have in mind."
              className="min-h-[120px] resize-none rounded-none bg-white/[0.04] px-4 py-4 text-sm font-semibold leading-relaxed text-white outline-none transition placeholder:text-zinc-600 focus:bg-white/[0.08]"
            />
          </label>

          <button
            type="submit"
            className="glow-cta mt-4 flex h-14 w-full items-center justify-center text-sm font-black uppercase tracking-widest"
          >
            Request meeting
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BookMeetingPage() {
  const [form, setForm] = useState(DEFAULT_FORM);

  const handleSelectSlot = (dayIndex, time) => {
    setForm((current) => ({
      ...current,
      date: nextDateForWeekday(dayIndex),
      time,
    }));
    window.requestAnimationFrame(() => {
      document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="landing-v2 min-h-screen bg-black text-white">
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-16 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] opacity-30" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_70%)]" />

        <motion.h1 {...fadeUp()} className="max-w-2xl text-4xl font-black leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl">
          Let&apos;s map your next room.
        </motion.h1>

        <motion.p {...fadeUp(0.08)} className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400">
          20 minutes. We&apos;ll cover tickets, shared cameras, scrapbooks, and whether PXI is the right fit.
        </motion.p>

        <MotionDiv {...fadeUp(0.16)} className="mt-8 flex items-center justify-center gap-6 text-sm font-semibold text-zinc-500 uppercase tracking-widest">
          <span className="flex items-center gap-2">
            <Clock3 className="size-4" /> 20 min
          </span>
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4" /> Eastern time
          </span>
        </MotionDiv>
      </section>

      <section className="mx-auto max-w-[900px] px-4 pb-32 sm:px-6">
        <div className="flex flex-col gap-10">
          <MotionDiv {...fadeUp(0.24)}>
            <CalendarPreview form={form} onSelectSlot={handleSelectSlot} />
          </MotionDiv>
          <MotionDiv {...fadeUp(0.32)}>
            <SchedulerFrame form={form} setForm={setForm} />
          </MotionDiv>
        </div>
      </section>
    </div>
  );
}
