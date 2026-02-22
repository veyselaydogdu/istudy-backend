'use client';
import Link from 'next/link';

export default function FormsPage() {
    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Form Bileşenleri</span></li>
            </ul>

            <div className="mt-5 space-y-6">
                {/* Basic Inputs */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Temel Giriş Alanları</div>
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label htmlFor="text1">Metin</label>
                            <input id="text1" type="text" placeholder="Metin giriniz..." className="form-input" />
                        </div>
                        <div>
                            <label htmlFor="email1">E-posta</label>
                            <input id="email1" type="email" placeholder="ornek@mail.com" className="form-input" />
                        </div>
                        <div>
                            <label htmlFor="pass1">Şifre</label>
                            <input id="pass1" type="password" placeholder="••••••••" className="form-input" />
                        </div>
                        <div>
                            <label htmlFor="num1">Sayı</label>
                            <input id="num1" type="number" placeholder="0" className="form-input" />
                        </div>
                        <div>
                            <label htmlFor="date1">Tarih</label>
                            <input id="date1" type="date" className="form-input" />
                        </div>
                        <div>
                            <label htmlFor="time1">Saat</label>
                            <input id="time1" type="time" className="form-input" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="textarea1">Metin Alanı</label>
                            <textarea id="textarea1" rows={3} placeholder="Mesajınızı yazın..." className="form-textarea" />
                        </div>
                    </div>
                </div>

                {/* Input States */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Giriş Durumları</div>
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label>Normal</label>
                            <input type="text" placeholder="Normal alan" className="form-input" />
                        </div>
                        <div>
                            <label>Devre Dışı</label>
                            <input type="text" placeholder="Devre dışı" className="form-input" disabled />
                        </div>
                        <div className="has-error">
                            <label>Hatalı</label>
                            <input type="text" placeholder="Hatalı alan" className="form-input" />
                            <p className="mt-1 text-xs text-danger">Bu alan zorunludur.</p>
                        </div>
                        <div className="has-success">
                            <label>Başarılı</label>
                            <input type="text" placeholder="Geçerli alan" defaultValue="Doğru değer" className="form-input" />
                            <p className="mt-1 text-xs text-success">Geçerli bir değer girildi.</p>
                        </div>
                    </div>
                </div>

                {/* Select */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Seçim Kutuları</div>
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label>Tekli Seçim</label>
                            <select className="form-select">
                                <option value="">Seçiniz...</option>
                                <option value="1">Seçenek 1</option>
                                <option value="2">Seçenek 2</option>
                                <option value="3">Seçenek 3</option>
                            </select>
                        </div>
                        <div>
                            <label>Çoklu Seçim</label>
                            <select multiple className="form-multiselect">
                                <option value="1">Seçenek 1</option>
                                <option value="2">Seçenek 2</option>
                                <option value="3">Seçenek 3</option>
                                <option value="4">Seçenek 4</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Checkbox & Radio */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Onay Kutuları ve Radyo Butonlar</div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <p className="mb-3 font-semibold">Onay Kutuları</p>
                            <div className="space-y-2">
                                <label className="flex cursor-pointer items-center">
                                    <input type="checkbox" className="form-checkbox text-primary" defaultChecked />
                                    <span className="text-white-dark ltr:pl-3 rtl:pr-3">Primary</span>
                                </label>
                                <label className="flex cursor-pointer items-center">
                                    <input type="checkbox" className="form-checkbox text-success" />
                                    <span className="text-white-dark ltr:pl-3 rtl:pr-3">Success</span>
                                </label>
                                <label className="flex cursor-pointer items-center">
                                    <input type="checkbox" className="form-checkbox text-danger" />
                                    <span className="text-white-dark ltr:pl-3 rtl:pr-3">Danger</span>
                                </label>
                                <label className="flex cursor-pointer items-center">
                                    <input type="checkbox" className="form-checkbox text-warning" />
                                    <span className="text-white-dark ltr:pl-3 rtl:pr-3">Warning</span>
                                </label>
                                <label className="flex cursor-pointer items-center">
                                    <input type="checkbox" className="form-checkbox" disabled />
                                    <span className="text-white-dark ltr:pl-3 rtl:pr-3">Devre Dışı</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <p className="mb-3 font-semibold">Radyo Butonlar</p>
                            <div className="space-y-2">
                                <label className="flex cursor-pointer items-center">
                                    <input type="radio" name="radio1" className="form-radio text-primary" defaultChecked />
                                    <span className="text-white-dark ltr:pl-3 rtl:pr-3">Primary</span>
                                </label>
                                <label className="flex cursor-pointer items-center">
                                    <input type="radio" name="radio1" className="form-radio text-success" />
                                    <span className="text-white-dark ltr:pl-3 rtl:pr-3">Success</span>
                                </label>
                                <label className="flex cursor-pointer items-center">
                                    <input type="radio" name="radio1" className="form-radio text-danger" />
                                    <span className="text-white-dark ltr:pl-3 rtl:pr-3">Danger</span>
                                </label>
                                <label className="flex cursor-pointer items-center">
                                    <input type="radio" name="radio1" className="form-radio text-warning" />
                                    <span className="text-white-dark ltr:pl-3 rtl:pr-3">Warning</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Groups */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Giriş Grupları</div>
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label>Önce Metin</label>
                            <div className="flex">
                                <div className="flex items-center justify-center rounded-l-md border border-r-0 border-white-light bg-[#eee] px-3 font-semibold dark:border-[#17263c] dark:bg-[#1b2e4b]">@</div>
                                <input type="text" placeholder="Kullanıcı adı" className="form-input rounded-l-none" />
                            </div>
                        </div>
                        <div>
                            <label>Sonra Metin</label>
                            <div className="flex">
                                <input type="text" placeholder="Tutar" className="form-input rounded-r-none" />
                                <div className="flex items-center justify-center rounded-r-md border border-l-0 border-white-light bg-[#eee] px-3 font-semibold dark:border-[#17263c] dark:bg-[#1b2e4b]">₺</div>
                            </div>
                        </div>
                        <div>
                            <label>Sonra Buton</label>
                            <div className="flex">
                                <input type="text" placeholder="Aramak için yazın..." className="form-input rounded-r-none" />
                                <button type="button" className="btn btn-primary rounded-l-none">Ara</button>
                            </div>
                        </div>
                        <div>
                            <label>Toggle (Switch)</label>
                            <label className="relative mt-2 h-6 w-12 cursor-pointer">
                                <input type="checkbox" className="custom_switch peer absolute top-0 z-10 h-full w-full cursor-pointer opacity-0 ltr:left-0 rtl:right-0" />
                                <span className="outline_checkbox bg-icon block h-full rounded-full border-2 border-[#ebedf2] before:absolute before:bottom-1 before:left-1 before:h-4 before:w-4 before:rounded-full before:bg-[#ebedf2] before:bg-no-repeat before:transition-all before:duration-300 peer-checked:border-primary peer-checked:before:left-7 peer-checked:before:bg-primary dark:border-[#253b5c] dark:before:bg-[#253b5c] dark:peer-checked:before:bg-primary"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
