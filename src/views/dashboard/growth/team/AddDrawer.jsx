'use client';

import { useState } from 'react';
import { Button, Drawer, Field } from '@/components/dashboard/ui/kit';
import { cleanUsername } from '@/lib/staffSetup';
import { addSalesAmbassador } from '@/services/sales';

function Form({ cityName, onAdded }) {
    const [username, setUsername] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const name = cleanUsername(username);

    // An account is added by its exact username, as a claim's account is, so this is not a way to browse accounts.
    // The backend refuses an account that already has a staff or sales role, and its message is shown as it comes.
    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await addSalesAmbassador(name);
            const who = res.ambassador?.name || `@${res.ambassador?.username || name}`;
            onAdded(res.changed === false ? `${who} is already on your team.` : `${who} is on your team now and can raise claims in ${cityName || 'your city'}.`);
        } catch (err) {
            setError(err.message || 'That did not work. Try again.');
            setBusy(false);
        }
    };

    return (
        <form
            className="space-y-5"
            onSubmit={(e) => {
                e.preventDefault();
                if (name && !busy) submit();
            }}
        >
            <Field
                label="PXI username"
                aria-label="Ambassador username"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                hint={`The exact username, with or without the @. They raise claims in ${cityName || 'your city'} and you approve them.`}
            />
            <div className="space-y-3">
                <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy || !name}>
                    {busy ? 'Adding...' : 'Add ambassador'}
                </Button>
                {error ? <p className="text-[13px] text-red-300">{error}</p> : null}
            </div>
        </form>
    );
}

/** Put an account on your team by its exact username. The form starts fresh each time the drawer opens. */
export default function AddDrawer({ open, onClose, onAdded, cityName }) {
    return (
        <Drawer open={open} onClose={onClose} title="Add ambassador">
            <Form cityName={cityName} onAdded={onAdded} />
        </Drawer>
    );
}
