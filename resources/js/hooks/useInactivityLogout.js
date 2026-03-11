import { useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
const THROTTLE_MS = 1000; // Only reset timer at most once per second to avoid timer storms

/**
 * Logs out the user after a period of inactivity.
 * Handles background tab: when user returns, checks elapsed time and logs out if over limit.
 *
 * @param {number|null|undefined} timeoutMinutes - Idle timeout in minutes (from auth.idleTimeoutMinutes).
 */
export function useInactivityLogout(timeoutMinutes) {
    const timeoutMs = timeoutMinutes > 0 ? timeoutMinutes * 60 * 1000 : 0;
    const timerRef = useRef(null);
    const lastActivityRef = useRef(Date.now());
    const lastResetRef = useRef(0);

    const performLogout = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        router.post('/logout', { inactivity: true }, { preserveState: false });
    }, []);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        clearTimer();
        if (timeoutMs <= 0) return;
        timerRef.current = setTimeout(performLogout, timeoutMs);
    }, [timeoutMs, clearTimer, performLogout]);

    useEffect(() => {
        if (timeoutMs <= 0) return;

        lastActivityRef.current = Date.now();
        startTimer();

        const handleActivity = () => {
            const now = Date.now();
            lastActivityRef.current = now;
            if (now - lastResetRef.current >= THROTTLE_MS) {
                lastResetRef.current = now;
                startTimer();
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const elapsed = Date.now() - lastActivityRef.current;
                if (elapsed >= timeoutMs) {
                    performLogout();
                    return;
                }
                startTimer();
            }
        };

        ACTIVITY_EVENTS.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearTimer();
            ACTIVITY_EVENTS.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [timeoutMs, startTimer, clearTimer, performLogout]);
}
