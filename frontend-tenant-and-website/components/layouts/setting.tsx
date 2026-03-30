'use client';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '@/store';
import {
    toggleAnimation,
    toggleLayout,
    toggleMenu,
    toggleNavbar,
    toggleRTL,
    toggleTheme,
    toggleSemidark,
    resetToggleSidebar,
} from '@/store/themeConfigSlice';
import { Settings, X, Sun, Moon, Monitor } from 'lucide-react';

const Setting = () => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();
    const [showCustomizer, setShowCustomizer] = useState(false);

    return (
        <div>
            <div
                className={`${showCustomizer ? '!block' : ''} fixed inset-0 z-[51] hidden bg-[black]/60 transition-[display]`}
                onClick={() => setShowCustomizer(false)}
            />

            <nav
                className={`${
                    showCustomizer ? 'ltr:!right-0 rtl:!left-0' : ''
                } fixed bottom-0 top-0 z-[51] w-full max-w-[400px] bg-white p-4 shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-[right] duration-300 ltr:-right-[400px] rtl:-left-[400px] dark:bg-black`}
            >
                <button
                    type="button"
                    className="absolute bottom-0 top-0 my-auto flex h-10 w-12 cursor-pointer items-center justify-center bg-primary text-white ltr:-left-12 ltr:rounded-bl-full ltr:rounded-tl-full rtl:-right-12 rtl:rounded-br-full rtl:rounded-tr-full"
                    onClick={() => setShowCustomizer(!showCustomizer)}
                >
                    <Settings className="h-5 w-5 animate-[spin_3s_linear_infinite]" />
                </button>

                <div className="h-full overflow-y-auto overflow-x-hidden">
                    <div className="relative pb-5 text-center">
                        <button
                            type="button"
                            className="absolute top-0 opacity-30 hover:opacity-100 ltr:right-0 rtl:left-0 dark:text-white"
                            onClick={() => setShowCustomizer(false)}
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <h4 className="mb-1 dark:text-white">TEMA AYARLARI</h4>
                        <p className="text-white-dark">Tercihlerinizi ayarlayın.</p>
                    </div>

                    {/* Color Scheme */}
                    <div className="mb-3 rounded-md border border-dashed border-white-light p-3 dark:border-[#1b2e4b]">
                        <h5 className="mb-1 text-base leading-none dark:text-white">Renk Şeması</h5>
                        <p className="text-xs text-white-dark">Açık veya koyu tema.</p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                className={`${themeConfig.theme === 'light' ? 'btn-primary' : 'btn-outline-primary'} btn`}
                                onClick={() => dispatch(toggleTheme('light'))}
                            >
                                <Sun className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                                Açık
                            </button>
                            <button
                                type="button"
                                className={`${themeConfig.theme === 'dark' ? 'btn-primary' : 'btn-outline-primary'} btn`}
                                onClick={() => dispatch(toggleTheme('dark'))}
                            >
                                <Moon className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                                Koyu
                            </button>
                            <button
                                type="button"
                                className={`${themeConfig.theme === 'system' ? 'btn-primary' : 'btn-outline-primary'} btn`}
                                onClick={() => dispatch(toggleTheme('system'))}
                            >
                                <Monitor className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                                Sistem
                            </button>
                        </div>
                    </div>

                    {/* Navigation Position */}
                    <div className="mb-3 rounded-md border border-dashed border-white-light p-3 dark:border-[#1b2e4b]">
                        <h5 className="mb-1 text-base leading-none dark:text-white">Navigasyon Pozisyonu</h5>
                        <p className="text-xs text-white-dark">Menü tipi seçin.</p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                className={`${themeConfig.menu === 'horizontal' ? 'btn-primary' : 'btn-outline-primary'} btn`}
                                onClick={() => { dispatch(toggleMenu('horizontal')); dispatch(resetToggleSidebar()); }}
                            >
                                Yatay
                            </button>
                            <button
                                type="button"
                                className={`${themeConfig.menu === 'vertical' ? 'btn-primary' : 'btn-outline-primary'} btn`}
                                onClick={() => { dispatch(toggleMenu('vertical')); dispatch(resetToggleSidebar()); }}
                            >
                                Dikey
                            </button>
                            <button
                                type="button"
                                className={`${themeConfig.menu === 'collapsible-vertical' ? 'btn-primary' : 'btn-outline-primary'} btn`}
                                onClick={() => { dispatch(toggleMenu('collapsible-vertical')); dispatch(resetToggleSidebar()); }}
                            >
                                Daralt
                            </button>
                        </div>
                        <div className="mt-5 text-primary">
                            <label className="mb-0 inline-flex">
                                <input
                                    type="checkbox"
                                    className="form-checkbox"
                                    checked={themeConfig.semidark}
                                    onChange={(e) => dispatch(toggleSemidark(e.target.checked))}
                                />
                                <span>Yarı Karanlık</span>
                            </label>
                        </div>
                    </div>

                    {/* Layout Style */}
                    <div className="mb-3 rounded-md border border-dashed border-white-light p-3 dark:border-[#1b2e4b]">
                        <h5 className="mb-1 text-base leading-none dark:text-white">Düzen Stili</h5>
                        <div className="mt-3 flex gap-2">
                            <button
                                type="button"
                                className={`${themeConfig.layout === 'boxed-layout' ? 'btn-primary' : 'btn-outline-primary'} btn flex-auto`}
                                onClick={() => dispatch(toggleLayout('boxed-layout'))}
                            >
                                Kutulu
                            </button>
                            <button
                                type="button"
                                className={`${themeConfig.layout === 'full' ? 'btn-primary' : 'btn-outline-primary'} btn flex-auto`}
                                onClick={() => dispatch(toggleLayout('full'))}
                            >
                                Tam
                            </button>
                        </div>
                    </div>

                    {/* Navbar Type */}
                    <div className="mb-3 rounded-md border border-dashed border-white-light p-3 dark:border-[#1b2e4b]">
                        <h5 className="mb-1 text-base leading-none dark:text-white">Navbar Tipi</h5>
                        <div className="mt-3 flex items-center gap-3 text-primary">
                            {(['navbar-sticky', 'navbar-floating', 'navbar-static'] as const).map((val) => (
                                <label key={val} className="mb-0 inline-flex">
                                    <input
                                        type="radio"
                                        checked={themeConfig.navbar === val}
                                        value={val}
                                        className="form-radio"
                                        onChange={() => dispatch(toggleNavbar(val))}
                                    />
                                    <span className="capitalize">{val.replace('navbar-', '')}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Animation */}
                    <div className="mb-3 rounded-md border border-dashed border-white-light p-3 dark:border-[#1b2e4b]">
                        <h5 className="mb-1 text-base leading-none dark:text-white">Sayfa Geçiş Animasyonu</h5>
                        <div className="mt-3">
                            <select
                                className="form-select border-primary text-primary"
                                value={themeConfig.animation}
                                onChange={(e) => dispatch(toggleAnimation(e.target.value))}
                            >
                                <option value=" ">Yok</option>
                                <option value="animate__fadeIn">Fade</option>
                                <option value="animate__fadeInDown">Fade Down</option>
                                <option value="animate__fadeInUp">Fade Up</option>
                                <option value="animate__fadeInLeft">Fade Left</option>
                                <option value="animate__fadeInRight">Fade Right</option>
                                <option value="animate__slideInDown">Slide Down</option>
                                <option value="animate__slideInLeft">Slide Left</option>
                                <option value="animate__slideInRight">Slide Right</option>
                                <option value="animate__zoomIn">Zoom In</option>
                            </select>
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Setting;
