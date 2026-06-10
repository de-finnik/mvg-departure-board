"use client";
import { useEffect, useState } from "react";

const LS_KEY = "mvg-geolocation";

export function useGeolocation() {
    const [enabled, setEnabled] = useState(false);
    const [position, setPosition] = useState<GeolocationCoordinates | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (localStorage.getItem(LS_KEY) === "true") {
            setEnabled(true);
        }
    }, []);

    useEffect(() => {
        if (!enabled || position) return;
        requestPosition();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);

    function requestPosition() {
        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition(pos.coords);
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            },
            { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
        );
    }

    function enable() {
        localStorage.setItem(LS_KEY, "true");
        setEnabled(true);
        // Must be called synchronously within the click handler — Safari/iOS
        // only shows the permission prompt if getCurrentPosition runs inside
        // the user gesture's call stack, not from a deferred effect.
        requestPosition();
    }

    function disable() {
        localStorage.removeItem(LS_KEY);
        setEnabled(false);
        setPosition(null);
        setError(null);
    }

    return { enabled, position, error, loading, enable, disable };
}
