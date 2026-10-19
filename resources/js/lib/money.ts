/** Money يُنقل كقروش (integer). العرض كما في التصميم: «1,250 ج.م» (بدون كسور إذا كان صحيحًا). لا float في الحساب. */
export function formatMoney(minor: number): string {
    const neg = minor < 0 ? '-' : '';
    const abs = Math.abs(minor);
    const major = Math.floor(abs / 100);
    const frac = abs % 100;
    const int = major.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${neg}${int}${frac ? '.' + String(frac).padStart(2, '0') : ''} ج.م`;
}

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/** «18 يونيو 2025» (أرقام لاتينية كما في التصميم) */
export function formatDate(d: string | Date, opts: { year?: boolean; weekday?: boolean } = { year: true }): string {
    const x = typeof d === 'string' ? new Date(d) : d;
    const base = `${x.getDate()} ${MONTHS[x.getMonth()]}${opts.year === false ? '' : ' ' + x.getFullYear()}`;
    return opts.weekday ? `${DAYS[x.getDay()]}، ${base}` : base;
}

/** «09:42 ص» */
export function formatTime(d: string | Date): string {
    const x = typeof d === 'string' ? new Date(d) : d;
    const h = x.getHours();
    return `${String(h % 12 || 12).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')} ${h < 12 ? 'ص' : 'م'}`;
}

/** سعر بمنزلتين دائمًا كما في شاشات المنتجات: «2.00 ج.م» */
export function formatMoneyFixed(minor: number): string {
    const neg = minor < 0 ? '-' : '';
    const abs = Math.abs(minor);
    return `${neg}${Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${String(abs % 100).padStart(2, '0')} ج.م`;
}

/** أرقام عربية-هندية (١٢٣) كما في واجهة المصمم */
export function arDigits(v: number | string): string {
    return String(v).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

/** «17 أكتوبر 2026، 10:15 ص» بدون صفر بادئ للساعة */
export function formatDateTimeShort(d: string | Date): string {
    return `${formatDate(d)}، ${formatTime(d).replace(/^0/, '')}`;
}

/** ١٬٠٠٠ — أرقام هندية بفاصل آلاف عربي */
export function arNum(n: number): string {
    return arDigits(n.toLocaleString('en-US')).replace(/,/g, '٬');
}
