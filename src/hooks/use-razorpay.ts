
'use client';

import { useState, useEffect } from 'react';

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const loadScript = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

export const useRazorpay = () => {
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        // This checks if the Razorpay object is already available on the window
        if ((window as any).Razorpay) {
            if (isMounted) setIsScriptLoaded(true);
            return;
        }

        loadScript(RAZORPAY_SCRIPT_URL).then((isLoaded) => {
            if (isMounted) {
                setIsScriptLoaded(isLoaded);
            }
        });
        
        return () => {
            isMounted = false;
        };
    }, []);
    
    return [isScriptLoaded];
};

    