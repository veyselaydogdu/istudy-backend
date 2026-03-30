'use client';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function SweetAlertsPage() {
    const showBasic = () => {
        Swal.fire({ title: 'Kaydedildi!', padding: '2em', customClass: { popup: 'sweet-alerts' } });
    };

    const showSuccess = () => {
        Swal.fire({
            icon: 'success',
            title: 'Başarılı!',
            text: 'İşleminiz başarıyla tamamlandı.',
            padding: '2em',
            customClass: { popup: 'sweet-alerts' },
        });
    };

    const showError = () => {
        Swal.fire({
            icon: 'error',
            title: 'Hata!',
            text: 'Bir sorun oluştu. Lütfen tekrar deneyin.',
            padding: '2em',
            customClass: { popup: 'sweet-alerts' },
        });
    };

    const showWarning = () => {
        Swal.fire({
            icon: 'warning',
            title: 'Uyarı!',
            text: 'Bu işlem geri alınamaz!',
            showCancelButton: true,
            confirmButtonText: 'Evet, devam et',
            cancelButtonText: 'İptal',
            padding: '2em',
            customClass: { popup: 'sweet-alerts' },
        });
    };

    const showQuestion = () => {
        Swal.fire({
            icon: 'question',
            title: 'Emin misiniz?',
            text: 'Bu kaydı silmek istediğinizden emin misiniz?',
            showCancelButton: true,
            confirmButtonColor: '#e7515a',
            cancelButtonColor: '#888ea8',
            confirmButtonText: 'Evet, Sil!',
            cancelButtonText: 'İptal',
            padding: '2em',
            customClass: { popup: 'sweet-alerts' },
        });
    };

    const showInfo = () => {
        Swal.fire({
            icon: 'info',
            title: 'Bilgi',
            text: 'Sisteminiz güncel. Son güncelleme: bugün.',
            padding: '2em',
            customClass: { popup: 'sweet-alerts' },
        });
    };

    const showWithTitle = () => {
        Swal.fire({
            title: 'Oops...',
            text: 'Bir şeyler ters gitti!',
            icon: 'error',
            footer: '<a href="#">Neden bu hata oluşuyor?</a>',
            padding: '2em',
            customClass: { popup: 'sweet-alerts' },
        });
    };

    const showAutoClose = () => {
        let timerInterval: ReturnType<typeof setInterval>;
        Swal.fire({
            title: 'Otomatik kapanıyor!',
            html: '<b></b> saniye sonra kapanacak.',
            timer: 3000,
            timerProgressBar: true,
            didOpen: () => {
                Swal.showLoading();
                const b = Swal.getHtmlContainer()?.querySelector('b');
                if (b) {
                    timerInterval = setInterval(() => {
                        b.textContent = String(Math.ceil((Swal.getTimerLeft() ?? 0) / 1000));
                    }, 100);
                }
            },
            willClose: () => clearInterval(timerInterval),
            customClass: { popup: 'sweet-alerts' },
        });
    };

    const showHTML = () => {
        Swal.fire({
            title: '<strong>HTML</strong> Başlık',
            icon: 'info',
            html: '<b>Kalın</b> ve <i>italik</i> metin <br> <a href="https://istudy.com" target="_blank">link</a>',
            showCloseButton: true,
            showCancelButton: true,
            focusConfirm: false,
            confirmButtonText: '<i class="fa fa-thumbs-up"></i> Harika!',
            cancelButtonText: '<i class="fa fa-thumbs-down"></i>',
            customClass: { popup: 'sweet-alerts' },
        });
    };

    const showChaining = async () => {
        const { value: name } = await Swal.fire({
            title: 'Adınız nedir?',
            input: 'text',
            inputPlaceholder: 'Adınızı girin',
            showCancelButton: true,
            inputValidator: (value) => { if (!value) return 'Lütfen adınızı girin!'; },
            customClass: { popup: 'sweet-alerts' },
        });
        if (name) {
            await Swal.fire({
                icon: 'success',
                title: `Merhaba ${name}!`,
                text: 'Hoş geldiniz.',
                customClass: { popup: 'sweet-alerts' },
            });
        }
    };

    const showCustomStyle = () => {
        Swal.fire({
            title: 'Özel Stil',
            text: 'Özel CSS stilleriyle SweetAlert.',
            confirmButtonText: 'Tamam',
            background: '#1b2e4b',
            color: '#fff',
            confirmButtonColor: '#4361ee',
            customClass: { popup: 'sweet-alerts' },
        });
    };

    const alerts = [
        { label: 'Temel Mesaj', fn: showBasic, color: 'btn-primary' },
        { label: 'Başarı', fn: showSuccess, color: 'btn-success' },
        { label: 'Hata', fn: showError, color: 'btn-danger' },
        { label: 'Uyarı (Onay)', fn: showWarning, color: 'btn-warning' },
        { label: 'Soru / Silme', fn: showQuestion, color: 'btn-outline-danger' },
        { label: 'Bilgi', fn: showInfo, color: 'btn-info' },
        { label: 'Footer ile', fn: showWithTitle, color: 'btn-outline-dark' },
        { label: 'Otomatik Kapat', fn: showAutoClose, color: 'btn-secondary' },
        { label: 'HTML İçerik', fn: showHTML, color: 'btn-outline-primary' },
        { label: 'Zincirleme Modal', fn: showChaining, color: 'btn-outline-success' },
        { label: 'Özel Stil', fn: showCustomStyle, color: 'btn-dark' },
    ];

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>SweetAlert</span></li>
            </ul>

            <div className="mt-5">
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">SweetAlert2 Örnekleri</div>
                    <div className="flex flex-wrap gap-3">
                        {alerts.map(({ label, fn, color }) => (
                            <button key={label} type="button" className={`btn ${color}`} onClick={fn}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
