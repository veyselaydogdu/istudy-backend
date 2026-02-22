'use client';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import Link from 'next/link';
import { Fragment, useState } from 'react';
import IconX from '@/components/icon/icon-x';

export default function ModalsPage() {
    const [modal1, setModal1] = useState(false);
    const [modal2, setModal2] = useState(false);
    const [modal3, setModal3] = useState(false);
    const [modal4, setModal4] = useState(false);
    const [modal5, setModal5] = useState(false);

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Modal</span></li>
            </ul>

            <div className="mt-5 space-y-6">
                {/* Basic Modals */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Temel Modal</div>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" className="btn btn-primary" onClick={() => setModal1(true)}>Modal Aç</button>
                        <button type="button" className="btn btn-success" onClick={() => setModal2(true)}>Küçük Modal</button>
                        <button type="button" className="btn btn-info" onClick={() => setModal3(true)}>Büyük Modal</button>
                        <button type="button" className="btn btn-warning" onClick={() => setModal4(true)}>Ortalanmış Modal</button>
                        <button type="button" className="btn btn-danger" onClick={() => setModal5(true)}>Silme Onayı</button>
                    </div>
                </div>
            </div>

            {/* Modal 1 - Basic */}
            <Transition appear show={modal1} as={Fragment}>
                <Dialog as="div" open={modal1} onClose={() => setModal1(false)}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0" />
                    </TransitionChild>
                    <div className="fixed inset-0 z-[999] overflow-y-auto bg-[black]/60">
                        <div className="flex min-h-screen items-start justify-center px-4">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className="panel my-8 w-full max-w-lg overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                                        <h5 className="text-lg font-bold">Modal Başlığı</h5>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setModal1(false)}><IconX /></button>
                                    </div>
                                    <div className="p-5">
                                        <p>Bu bir temel modal penceresidir. İçeriğinizi buraya ekleyebilirsiniz.</p>
                                        <p className="mt-2 text-white-dark">Modallar, kullanıcı dikkatini gerektiren önemli bilgileri veya formları göstermek için kullanılır.</p>
                                        <div className="mt-8 flex items-center justify-end gap-3">
                                            <button type="button" className="btn btn-outline-danger" onClick={() => setModal1(false)}>İptal</button>
                                            <button type="button" className="btn btn-primary" onClick={() => setModal1(false)}>Kaydet</button>
                                        </div>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Modal 2 - Small */}
            <Transition appear show={modal2} as={Fragment}>
                <Dialog as="div" open={modal2} onClose={() => setModal2(false)}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0" />
                    </TransitionChild>
                    <div className="fixed inset-0 z-[999] overflow-y-auto bg-[black]/60">
                        <div className="flex min-h-screen items-start justify-center px-4">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className="panel my-8 w-full max-w-sm overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                                        <h5 className="text-lg font-bold">Küçük Modal</h5>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setModal2(false)}><IconX /></button>
                                    </div>
                                    <div className="p-5">
                                        <p>Küçük boyutlu modal penceresi.</p>
                                        <div className="mt-5 flex justify-end"><button type="button" className="btn btn-success" onClick={() => setModal2(false)}>Tamam</button></div>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Modal 3 - Large */}
            <Transition appear show={modal3} as={Fragment}>
                <Dialog as="div" open={modal3} onClose={() => setModal3(false)}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0" />
                    </TransitionChild>
                    <div className="fixed inset-0 z-[999] overflow-y-auto bg-[black]/60">
                        <div className="flex min-h-screen items-start justify-center px-4">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className="panel my-8 w-full max-w-3xl overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                                        <h5 className="text-lg font-bold">Büyük Modal</h5>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setModal3(false)}><IconX /></button>
                                    </div>
                                    <div className="p-5">
                                        <p>Büyük boyutlu modal penceresi. Daha fazla içerik için kullanışlıdır.</p>
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div><label>Ad</label><input type="text" className="form-input" placeholder="Ad" /></div>
                                            <div><label>Soyad</label><input type="text" className="form-input" placeholder="Soyad" /></div>
                                            <div><label>E-posta</label><input type="email" className="form-input" placeholder="E-posta" /></div>
                                            <div><label>Telefon</label><input type="tel" className="form-input" placeholder="Telefon" /></div>
                                        </div>
                                        <div className="mt-8 flex justify-end gap-3">
                                            <button type="button" className="btn btn-outline-danger" onClick={() => setModal3(false)}>İptal</button>
                                            <button type="button" className="btn btn-info" onClick={() => setModal3(false)}>Kaydet</button>
                                        </div>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Modal 4 - Vertically Centered */}
            <Transition appear show={modal4} as={Fragment}>
                <Dialog as="div" open={modal4} onClose={() => setModal4(false)}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0" />
                    </TransitionChild>
                    <div className="fixed inset-0 z-[999] overflow-y-auto bg-[black]/60">
                        <div className="flex min-h-screen items-center justify-center px-4">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className="panel w-full max-w-lg overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                                        <h5 className="text-lg font-bold">Ortalanmış Modal</h5>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setModal4(false)}><IconX /></button>
                                    </div>
                                    <div className="p-5">
                                        <p>Bu modal dikey olarak ortalanmıştır.</p>
                                        <div className="mt-8 flex justify-end gap-3">
                                            <button type="button" className="btn btn-outline-danger" onClick={() => setModal4(false)}>İptal</button>
                                            <button type="button" className="btn btn-warning" onClick={() => setModal4(false)}>Tamam</button>
                                        </div>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Modal 5 - Confirm Delete */}
            <Transition appear show={modal5} as={Fragment}>
                <Dialog as="div" open={modal5} onClose={() => setModal5(false)}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0" />
                    </TransitionChild>
                    <div className="fixed inset-0 z-[999] overflow-y-auto bg-[black]/60">
                        <div className="flex min-h-screen items-center justify-center px-4">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className="panel w-full max-w-sm overflow-hidden rounded-lg border-0 p-0 text-center text-black dark:text-white-dark">
                                    <div className="p-8">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger-light text-danger">
                                            <IconX className="h-8 w-8" />
                                        </div>
                                        <h4 className="text-xl font-bold dark:text-white">Silmek istediğinizden emin misiniz?</h4>
                                        <p className="mt-2 text-white-dark">Bu işlem geri alınamaz.</p>
                                        <div className="mt-6 flex justify-center gap-3">
                                            <button type="button" className="btn btn-outline-dark" onClick={() => setModal5(false)}>İptal</button>
                                            <button type="button" className="btn btn-danger" onClick={() => setModal5(false)}>Evet, Sil</button>
                                        </div>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}
