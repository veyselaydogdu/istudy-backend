export const metadata = { title: 'Hakkımızda' };

export default function AboutPage() {
    return (
        <section className="py-20">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold text-dark dark:text-white">Hakkımızda</h1>
                    <p className="mt-4 text-lg text-[#515365] dark:text-[#888ea8]">
                        iStudy, anaokulu ve kreş yönetimini kolaylaştırmak için tasarlandı
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="panel">
                        <h2 className="mb-3 text-xl font-bold text-dark dark:text-white">Misyonumuz</h2>
                        <p className="text-[#515365] dark:text-[#888ea8]">
                            Her çocuğun güvenli ve kaliteli bir eğitim ortamında büyümesi için anaokulu yöneticilerine
                            güçlü, kullanımı kolay dijital araçlar sunmak.
                        </p>
                    </div>

                    <div className="panel">
                        <h2 className="mb-3 text-xl font-bold text-dark dark:text-white">Vizyonumuz</h2>
                        <p className="text-[#515365] dark:text-[#888ea8]">
                            Türkiye&apos;nin erken çocukluk eğitim kurumlarının dijital dönüşümüne öncülük etmek ve
                            sektörün standart yönetim platformu olmak.
                        </p>
                    </div>

                    <div className="panel md:col-span-2">
                        <h2 className="mb-3 text-xl font-bold text-dark dark:text-white">Değerlerimiz</h2>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                { title: 'Güven', desc: 'Verilerinizi en yüksek güvenlik standartlarıyla koruruz.' },
                                { title: 'Kolaylık', desc: 'Sezgisel arayüzle herkes kolayca kullanabilir.' },
                                { title: 'Destek', desc: '7/24 teknik destek ekibimizle her zaman yanınızdayız.' },
                            ].map((v) => (
                                <div key={v.title} className="rounded-lg bg-[#f1f2f3] p-4 dark:bg-[#1b2e4b]">
                                    <h3 className="mb-2 font-semibold text-dark dark:text-white">{v.title}</h3>
                                    <p className="text-sm text-[#515365] dark:text-[#888ea8]">{v.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
