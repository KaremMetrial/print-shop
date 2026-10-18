# 02 — Requirements Register

صيغة: `REQ-<module>-<n>` ← مصدر في project.md ← أولوية (M=Must, S=Should) ← Phase.
القواعد الصلبة = BR-xxx في الفصل 44. هذا الملف يجمّعها حسب Module لتسهل الـ traceability.

## A. Identity & Access (Phase 1)
| ID | المتطلب | المصدر | P | Phase |
|---|---|---|---|---|
| REQ-AUTH-01 | Staff login بـ Email+Password، حساب Active فقط، rate limit | S-001, §35.2 | M | 1 |
| REQ-AUTH-02 | Customer login بالموبايل + باسورد مولّد، Platform Access مفعّل | BR-003/007 | M | 1 |
| REQ-AUTH-03 | RBAC: 5 أدوار + permission keys + overrides مسجلة | §4.2, §4.6 | M | 1 |
| REQ-AUTH-04 | منع التصعيد الإداري (Admin→Admin) على مستوى API | BR-072/073 | M | 1 |
| REQ-AUTH-05 | تعطيل الموظف ينهي جلسته فورًا | 40.36 | M | 1 |
| REQ-AUTH-06 | Record-level authz (Designer يرى بنوده فقط) | §4.4 | M | 1 |
| REQ-AUTH-07 | Password recovery للعميل = Action للموظف المخوّل | §14, S-080 | M | 8 |

## B. Customers (Phase 1)
| REQ-CUS-01 | اسم+هاتف إجباري، تطبيع الهاتف، تحذير التكرار | BR-001/002, 40.1 | M | 1 |
| REQ-CUS-02 | Pricing tier لكل عميل (يؤثر على الجديد فقط) | 40.4 | M | 2 |
| REQ-CUS-03 | Platform Access enable/disable/reset، كلمة السر تُعرض مرة واحدة | S-031 | M | 1 |
| REQ-CUS-04 | Customer profile بتبويباته (حسب الصلاحية) | S-024..032 | M | 1 |

## C. Catalog & Pricing (Phase 2)
| REQ-CAT-01 | Products/Categories/Option groups/values + MOQ + required specialty | §12, S-033..035 | M | 2 |
| REQ-PRC-01 | معادلة التسعير + Percentage/Fixed-base tiers | §12.3–12.5 | M | 2 |
| REQ-PRC-02 | Snapshots في كل بند؛ لا إعادة تسعير | BR-057 | M | 2 |
| REQ-PRC-03 | Order discount بصلاحية، لا ينزل تحت المدفوع | BR-056/060 | M | 2/7 |
| REQ-PRC-04 | `POST /pricing/quote` + السيرفر هو المرجع النهائي | §30.7 | M | 2 |
| REQ-PRC-05 | سياسة التقريب موحدة (Quote=Order=Invoice=Ledger) | E.13 | M | 2 |

## D. Orders & Requests (Phase 3)
| REQ-ORD-01 | Create Order Wizard (5 خطوات) في معاملة واحدة | S-011 | M | 3 |
| REQ-ORD-02 | Orders list/filter/search + details tabs | S-010,012..014 | M | 3 |
| REQ-ORD-03 | تعديل الأوردر قبل الطباعة + Old/New dialog + audit | S-015 | M | 3 |
| REQ-ORD-04 | Soft-cancel للبند + أثر السعر والاعتماد | 6.6 | M | 3 |
| REQ-ORD-05 | Cancel Order (Admin/SA، سبب إلزامي، قفل الروابط/الشات) | BR-042/043 | M | 3/7 |
| REQ-REQ-01 | Order Request: submit / Start Review (atomic claim) / edit / accept(once) / reject(reason) | BR-008..012 | M | 3 |
| REQ-REQ-02 | Request history immutable + snapshots | S-021 | M | 3 |

## E. Design Workflow (Phase 4)
| REQ-DSG-01 | Auto-assign: specialty → availability → min active work → tie-break ثابت | BR-015..017 | M | 4 |
| REQ-DSG-02 | Manual assign/reassign + history + فقدان وصول القديم | 9.5 | M | 4 |
| REQ-DSG-03 | Task states + Start Design صريح | BR-018 | M | 4 |
| REQ-DSG-04 | Versions كاملة، تعديل غير المعتمدة داخل نفس الرقم + manifest revision | BR-019..021 | M | 4 |
| REQ-DSG-05 | Approve: lock + stale check + chat lock + all-items → In Printing | BR-026..030 | M | 4 |
| REQ-DSG-06 | Reopen (Admin/SA، قبل الطباعة، سبب) | BR-029 | M | 4 |
| REQ-DSG-07 | Designer availability مستقلة عن الدخول | 9.6 | M | 4 |

## F. Chat, Files, Links (Phase 5)
| REQ-CHT-01 | شات لكل بند: نص/صوت/صور/PDF، realtime، idempotent بـ client_message_id | §10.6, 32.24 | M | 5 |
| REQ-CHT-02 | رسالة العميل أثناء Awaiting Approval → Revision Requested (لا زر) | BR-024 | M | 5 |
| REQ-CHT-03 | Data Entry قراءة فقط | BR-070 | M | 5 |
| REQ-FIL-01 | تخزين خاص + prepare/complete + تحقق MIME/signature/size | §35.6–7 | M | 5 |
| REQ-FIL-02 | Design Preview View-Only للعميل بلا تنزيل | BR-022 | M | 5 |
| REQ-LNK-01 | رابط خاص بـ token hash: suspend/reactivate/regenerate/close | BR-004..006 | M | 5 |

## G. Fulfillment (Phase 6)
| REQ-FUL-01 | Complete Printing (واحد للأوردر) → Ready Pickup/Delivery | BR-031..037 | M | 6 |
| REQ-FUL-02 | Out for Delivery + Complete يدوي/تلقائي 24h (idempotent) | BR-038/039 | M | 6 |
| REQ-FUL-03 | Print Job Ticket PDF (داخلي) | S-018 | M | 6 |
| REQ-FUL-04 | شاشات حالة العميل (printing/ready/out/closed) | S-089..093 | M | 6 |

## H. Finance (Phase 7)
| REQ-FIN-01 | Payment واحدة + Allocations (Targeted/FIFO) + منع Overpayment + idempotency | BR-050..052, 085 | M | 7 |
| REQ-FIN-02 | Payment proof: pending→confirm/reject | 13.5, S-052 | M | 7 |
| REQ-FIN-03 | Correction بـ adjustments + إعادة تخصيص + audit | BR-054, S-058 | M | 7 |
| REQ-FIN-04 | Cancel → Refund Due → Payouts جزئية | BR-044..048 | M | 7 |
| REQ-FIN-05 | Ledger موحد + Receivables + فصل Refund Due | S-053/054 | M | 7 |
| REQ-FIN-06 | Invoice / Payment receipt / Refund receipt (PDF عربي) | BR-063/064 | M | 7 |
| REQ-FIN-07 | Data Entry: يسجل دفعة ويرى المستحق فقط | BR-053 | M | 7 |

## I. Notifications, Actions, Search (Phase 8)
| REQ-NTF-01 | Notifications داخلية realtime + عدّادات | BR-065 | M | 8 |
| REQ-ACT-01 | Action Center (claim atomic، complete بفعل حقيقي، dedupe_key، أقدم أولًا) | BR-066/067 | M | 8 |
| REQ-WA-01 | WhatsApp يدوي + اختياري تلقائي لـ design-ready فقط | BR-068/069 | M/S | 8 |
| REQ-SRC-01 | Global search (order#, item#, name, phone) | §15.1 | M | 8 |
| REQ-IMG-01 | Search by image (embeddings, top 5–10, permissions-filtered, query image مؤقتة) | BR-074..076 | M | 8 |

## J. Reports, Settings, Audit, Ops (Phase 9)
| REQ-RPT-01 | تقارير تشغيلية/مالية بتعريفات §39، تصدير PDF/CSV بنفس الصلاحيات | §39 | M | 9 |
| REQ-SET-01 | إعدادات مجمّعة + سرّيات مخفية + audit | §37 | M | 9 |
| REQ-AUD-01 | Audit append-only + عرض/فلترة/تصدير | BR-083, S-077 | M | 9 |
| REQ-OPS-01 | Health checks، logging، backup يومي + restore test | §38 | M | 9/10 |

## K. Non-Functional
| REQ-NFR-01 | RTL + موبايل لكل شاشة (cards بدل wide tables) | §17, §28.6 | M | all |
| REQ-NFR-02 | كل شاشة: Loading/Empty/Error/Success/Forbidden/Stale | §28.1 | M | all |
| REQ-NFR-03 | فشل WhatsApp/Image-index/PDF لا يكسر العملية الأساسية | BR-089, §29.8 | M | all |
| REQ-NFR-04 | أمان: BOLA، escalation، file IDOR، replay، double-submit | §41.11 | M | all |
| REQ-NFR-05 | A11y: لون ≠ معنى، focus، labels، keyboard | §17.10 | S | all |

## Open Decisions (لازم قرار من المالك قبل/أثناء المرحلة)
| # | القرار | يلزم قبل |
|---|---|---|
| D1 | سياسة التقريب النقدي | Phase 2 |
| D2 | حدود الملفات/الصوت/المرفقات | Phase 5 |
| D3 | مزود WhatsApp | Phase 8 |
| D4 | سياسة طلب Review محجوز لموظف غائب (حاليًا: لا auto-unlock) | Phase 3 |
| D5 | سياسة الاحتفاظ والنسخ الاحتياطي | Phase 9 |
| D6 | عينة ومعيار قبول البحث بالصورة | Phase 8 |
| D7 | متطلبات فواتير قانونية/ضريبية | Phase 7 |
| D8 | الاستضافة (VPS/Docker/Forge) | Phase 0 |
