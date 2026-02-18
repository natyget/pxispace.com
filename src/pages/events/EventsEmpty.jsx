import React from "react";
import Button from "../../components/ui/Button";

const EventsEmpty = ({ reset }) => {
  return (
    <div className="py-40 text-center">
      <h3 className="text-4xl font-black uppercase text-zinc-800 mb-6 tracking-tighter">
        No signals in this frequency
      </h3>

      <p className="text-zinc-500 mb-12 max-w-sm mx-auto text-lg">
        Try a different vibe or clear your search to find the perfect party.
      </p>

      <Button
        variant="glass"
        className="px-12 py-4 text-sm"
        onClick={reset}
      >
        Reset Explorer
      </Button>
    </div>
  );
};

export default EventsEmpty;
