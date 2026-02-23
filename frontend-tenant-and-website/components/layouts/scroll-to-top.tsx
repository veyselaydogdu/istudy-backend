'use client';
import React, { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTop = () => {
    const [showTopButton, setShowTopButton] = useState(false);

    const goToTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };

    useEffect(() => {
        const onScrollHandler = () => {
            setShowTopButton(document.documentElement.scrollTop > 50);
        };
        window.addEventListener('scroll', onScrollHandler);
        return () => window.removeEventListener('scroll', onScrollHandler);
    }, []);

    return (
        <div className="fixed bottom-6 z-50 ltr:right-6 rtl:left-6">
            {showTopButton && (
                <button
                    type="button"
                    className="btn btn-outline-primary animate-pulse rounded-full bg-[#fafafa] p-2 dark:bg-[#060818] dark:hover:bg-primary"
                    onClick={goToTop}
                >
                    <ChevronUp className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};

export default ScrollToTop;
