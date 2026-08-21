// مولَّد آليًا من nabati/data/*.json — لا تحرّره يدويًا.
// أعِد التوليد بـ: node nabati/tools/bundle-data.js
export const DATA = {
  "tafaeel": {
    "$schema": "./schema/tafaeel.schema.json",
    "description": "التفعيلات. كل تفعيلة معرَّفة بنمطها المقطعي (S=مقطع قصير CV، L=مقطع طويل CVC أو CVV) وبنمطها الحرفي الخليلي (1=متحرك، 0=ساكن). النمطان مشتقّان من نطق التفعيلة نفسها، ومُتحقَّق من تطابقهما آليًا في tests/meters.test.js.",
    "legend": {
      "syllables": {
        "S": "مقطع قصير — صامت + حركة قصيرة (CV)",
        "L": "مقطع طويل — CVC أو CVV"
      },
      "khalilLetters": {
        "0": "ساكن",
        "1": "متحرك"
      },
      "status": {
        "STANDARD": "تفعيلة خليلية موثّقة",
        "NEEDS_VALIDATION": "وردت في المادة المصدرية لكن لم تثبت صحتها — لم تُغيَّر"
      }
    },
    "tafaeel": [
      {
        "id": "faulun",
        "plain": "فعولن",
        "vocalized": "فَعُولُنْ",
        "syllables": [
          "S",
          "L",
          "L"
        ],
        "khalilLetters": "11010",
        "components": [
          "وتد مجموع",
          "سبب خفيف"
        ],
        "status": "STANDARD"
      },
      {
        "id": "failun",
        "plain": "فاعلن",
        "vocalized": "فَاعِلُنْ",
        "syllables": [
          "L",
          "S",
          "L"
        ],
        "khalilLetters": "10110",
        "components": [
          "سبب خفيف",
          "وتد مجموع"
        ],
        "status": "STANDARD"
      },
      {
        "id": "mafailun",
        "plain": "مفاعيلن",
        "vocalized": "مَفَاعِيلُنْ",
        "syllables": [
          "S",
          "L",
          "L",
          "L"
        ],
        "khalilLetters": "1101010",
        "components": [
          "وتد مجموع",
          "سبب خفيف",
          "سبب خفيف"
        ],
        "status": "STANDARD"
      },
      {
        "id": "mustafilun",
        "plain": "مستفعلن",
        "vocalized": "مُسْتَفْعِلُنْ",
        "syllables": [
          "L",
          "L",
          "S",
          "L"
        ],
        "khalilLetters": "1010110",
        "components": [
          "سبب خفيف",
          "سبب خفيف",
          "وتد مجموع"
        ],
        "status": "STANDARD"
      },
      {
        "id": "failatun",
        "plain": "فاعلاتن",
        "vocalized": "فَاعِلَاتُنْ",
        "syllables": [
          "L",
          "S",
          "L",
          "L"
        ],
        "khalilLetters": "1011010",
        "components": [
          "سبب خفيف",
          "وتد مجموع",
          "سبب خفيف"
        ],
        "status": "STANDARD"
      },
      {
        "id": "failun_short",
        "plain": "فعلن",
        "vocalized": "فَعِلُنْ",
        "syllables": [
          "S",
          "S",
          "L"
        ],
        "khalilLetters": "1110",
        "components": [
          "فاصلة صغرى"
        ],
        "status": "STANDARD",
        "note": "المخبونة. الرسم «فعلن» يحتمل أيضًا فَعْلُنْ — انظر faalun."
      },
      {
        "id": "faalun",
        "plain": "فعلن",
        "vocalized": "فَعْلُنْ",
        "syllables": [
          "L",
          "L"
        ],
        "khalilLetters": "1010",
        "components": [
          "سبب خفيف",
          "سبب خفيف"
        ],
        "status": "STANDARD",
        "note": "المقطوعة. نفس رسم فَعِلُنْ غير مشكولًا — التمييز بينهما variation لا تفعيلتان منفصلتان في المطابقة."
      },
      {
        "id": "mufaalatun",
        "plain": "مفاعلتن",
        "vocalized": "مُفَاعَلَتُنْ",
        "syllables": [
          "S",
          "L",
          "S",
          "S",
          "L"
        ],
        "khalilLetters": "1101110",
        "components": [
          "وتد مجموع",
          "فاصلة صغرى"
        ],
        "status": "STANDARD",
        "note": "غير مستعملة في أي بحر من مصدرنا — مُدرجة لأنها أحد المرشحَين لتصحيح «مفاعلاتن»."
      },
      {
        "id": "mufaalatun_source",
        "plain": "مفاعلاتن",
        "vocalized": "مُفَاعَلَاتُنْ",
        "syllables": [
          "S",
          "L",
          "S",
          "L",
          "L"
        ],
        "khalilLetters": "11011010",
        "components": [
          "وتد مجموع",
          "وتد مجموع",
          "سبب خفيف"
        ],
        "status": "NEEDS_VALIDATION",
        "sourceQuote": "الصخري: مفاعلاتن | مفاعلاتن | فعولن",
        "validation": {
          "issue": "ثمانية أحرف. لا تفعيلة خليلية تتجاوز سبعة.",
          "candidates": [
            "mufaalatun",
            "mafailun"
          ],
          "resolvedBy": "بيت صخري واحد حقيقي مع تقطيعه من تطبيق ميزان النبط",
          "action": "مُبقاة كما وردت حرفيًا في المصدر. لم يُغيَّر شيء."
        }
      }
    ]
  },
  "variations": {
    "description": "الزحافات والعلل المسموحة لكل تفعيلة. الزحاف يدخل الحشو والعروض والضرب (scope=any)؛ العلة لا تدخل إلا العروض والضرب (scope=arud_darb). التكلفة الفعلية تأتي من scoring.json حسب kind و severity — لا أرقام مبعثرة هنا.",
    "legend": {
      "kind": {
        "salim": "التفعيلة تامة",
        "zihaf": "زحاف — تغيير في الأسباب، جائز في الحشو",
        "illa": "علة — لازمة في العروض والضرب وحدهما",
        "ambiguous_reading": "قراءتان مشروعتان لرسم واحد غير مشكول — ليست عيبًا"
      },
      "scope": {
        "any": "الحشو والعروض والضرب",
        "arud_darb": "العروض والضرب فقط"
      },
      "severity": {
        "1": "شائع",
        "2": "نادر أو ثقيل"
      },
      "X": "مقطع مفرط الطول (CVVC/CVCC) — لا يقع إلا في نهاية الشطر"
    },
    "variations": {
      "mustafilun": [
        {
          "id": "salim",
          "name": "سالم",
          "result": "مُسْتَفْعِلُنْ",
          "syllables": [
            "L",
            "L",
            "S",
            "L"
          ],
          "kind": "salim",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "khabn",
          "name": "الخبن",
          "result": "مُتَفْعِلُنْ",
          "syllables": [
            "S",
            "L",
            "S",
            "L"
          ],
          "kind": "zihaf",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "tayy",
          "name": "الطي",
          "result": "مُسْتَعِلُنْ",
          "syllables": [
            "L",
            "S",
            "S",
            "L"
          ],
          "kind": "zihaf",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "khabl",
          "name": "الخبل",
          "result": "مُتَعِلُنْ",
          "syllables": [
            "S",
            "S",
            "S",
            "L"
          ],
          "kind": "zihaf",
          "scope": "any",
          "severity": 2
        },
        {
          "id": "qat",
          "name": "القطع",
          "result": "مَفْعُولُنْ",
          "syllables": [
            "L",
            "L",
            "L"
          ],
          "kind": "illa",
          "scope": "arud_darb",
          "severity": 1
        },
        {
          "id": "tadhyil",
          "name": "التذييل",
          "result": "مُسْتَفْعِلَانْ",
          "syllables": [
            "L",
            "L",
            "S",
            "X"
          ],
          "kind": "illa",
          "scope": "arud_darb",
          "severity": 1
        }
      ],
      "failun": [
        {
          "id": "salim",
          "name": "سالم",
          "result": "فَاعِلُنْ",
          "syllables": [
            "L",
            "S",
            "L"
          ],
          "kind": "salim",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "khabn",
          "name": "الخبن",
          "result": "فَعِلُنْ",
          "syllables": [
            "S",
            "S",
            "L"
          ],
          "kind": "zihaf",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "qat",
          "name": "القطع",
          "result": "فَعْلُنْ",
          "syllables": [
            "L",
            "L"
          ],
          "kind": "illa",
          "scope": "arud_darb",
          "severity": 1
        },
        {
          "id": "tadhyil",
          "name": "التذييل",
          "result": "فَاعِلَانْ",
          "syllables": [
            "L",
            "S",
            "X"
          ],
          "kind": "illa",
          "scope": "arud_darb",
          "severity": 1
        }
      ],
      "failatun": [
        {
          "id": "salim",
          "name": "سالم",
          "result": "فَاعِلَاتُنْ",
          "syllables": [
            "L",
            "S",
            "L",
            "L"
          ],
          "kind": "salim",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "khabn",
          "name": "الخبن",
          "result": "فَعِلَاتُنْ",
          "syllables": [
            "S",
            "S",
            "L",
            "L"
          ],
          "kind": "zihaf",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "kaff",
          "name": "الكف",
          "result": "فَاعِلَاتُ",
          "syllables": [
            "L",
            "S",
            "L",
            "S"
          ],
          "kind": "zihaf",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "shakl",
          "name": "الشكل",
          "result": "فَعِلَاتُ",
          "syllables": [
            "S",
            "S",
            "L",
            "S"
          ],
          "kind": "zihaf",
          "scope": "any",
          "severity": 2
        },
        {
          "id": "hadhf",
          "name": "الحذف",
          "result": "فَاعِلُنْ",
          "syllables": [
            "L",
            "S",
            "L"
          ],
          "kind": "illa",
          "scope": "arud_darb",
          "severity": 1
        },
        {
          "id": "tashith",
          "name": "التشعيث",
          "result": "مَفْعُولُنْ",
          "syllables": [
            "L",
            "L",
            "L"
          ],
          "kind": "illa",
          "scope": "arud_darb",
          "severity": 1
        },
        {
          "id": "tadhyil",
          "name": "التذييل",
          "result": "فَاعِلَاتَانْ",
          "syllables": [
            "L",
            "S",
            "L",
            "X"
          ],
          "kind": "illa",
          "scope": "arud_darb",
          "severity": 1
        }
      ],
      "faulun": [
        {
          "id": "salim",
          "name": "سالم",
          "result": "فَعُولُنْ",
          "syllables": [
            "S",
            "L",
            "L"
          ],
          "kind": "salim",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "qabd",
          "name": "القبض",
          "result": "فَعُولُ",
          "syllables": [
            "S",
            "L",
            "S"
          ],
          "kind": "zihaf",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "hadhf",
          "name": "الحذف",
          "result": "فَعُولْ",
          "syllables": [
            "S",
            "L"
          ],
          "kind": "illa",
          "scope": "arud_darb",
          "severity": 1
        },
        {
          "id": "batr",
          "name": "البتر",
          "result": "فَعْ",
          "syllables": [
            "L"
          ],
          "kind": "illa",
          "scope": "arud_darb",
          "severity": 2
        }
      ],
      "mafailun": [
        {
          "id": "salim",
          "name": "سالم",
          "result": "مَفَاعِيلُنْ",
          "syllables": [
            "S",
            "L",
            "L",
            "L"
          ],
          "kind": "salim",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "qabd",
          "name": "القبض",
          "result": "مَفَاعِلُنْ",
          "syllables": [
            "S",
            "L",
            "S",
            "L"
          ],
          "kind": "zihaf",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "kaff",
          "name": "الكف",
          "result": "مَفَاعِيلُ",
          "syllables": [
            "S",
            "L",
            "L",
            "S"
          ],
          "kind": "zihaf",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "hadhf",
          "name": "الحذف",
          "result": "فَعُولُنْ",
          "syllables": [
            "S",
            "L",
            "L"
          ],
          "kind": "illa",
          "scope": "arud_darb",
          "severity": 1
        }
      ],
      "failun_short": [
        {
          "id": "salim",
          "name": "فَعِلُنْ",
          "result": "فَعِلُنْ",
          "syllables": [
            "S",
            "S",
            "L"
          ],
          "kind": "salim",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "faalun_reading",
          "name": "قراءة فَعْلُنْ",
          "result": "فَعْلُنْ",
          "syllables": [
            "L",
            "L"
          ],
          "kind": "ambiguous_reading",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "tadhyil",
          "name": "التذييل",
          "result": "فَعِلَانْ",
          "syllables": [
            "S",
            "S",
            "X"
          ],
          "kind": "illa",
          "scope": "arud_darb",
          "severity": 1
        }
      ],
      "faalun": [
        {
          "id": "salim",
          "name": "سالم",
          "result": "فَعْلُنْ",
          "syllables": [
            "L",
            "L"
          ],
          "kind": "salim",
          "scope": "any",
          "severity": 1
        }
      ],
      "mufaalatun": [
        {
          "id": "salim",
          "name": "سالم",
          "result": "مُفَاعَلَتُنْ",
          "syllables": [
            "S",
            "L",
            "S",
            "S",
            "L"
          ],
          "kind": "salim",
          "scope": "any",
          "severity": 1
        },
        {
          "id": "asb",
          "name": "العصب",
          "result": "مُفَاعَلْتُنْ",
          "syllables": [
            "S",
            "L",
            "L",
            "L"
          ],
          "kind": "zihaf",
          "scope": "any",
          "severity": 1
        }
      ],
      "mufaalatun_source": [
        {
          "id": "salim",
          "name": "سالم",
          "result": "مُفَاعَلَاتُنْ",
          "syllables": [
            "S",
            "L",
            "S",
            "L",
            "L"
          ],
          "kind": "salim",
          "scope": "any",
          "severity": 1
        }
      ]
    },
    "openQuestions": {
      "mufaalatun_source": "لا زحافات مسجَّلة — لأن التفعيلة نفسها غير مثبتة، واختراع زحافات لها يضاعف الخطأ. الصخري لذلك أشدّ صرامة من بقية البحور حتى يصل تحقّق. انظر OPEN-QUESTIONS.md"
    }
  },
  "meters": {
    "description": "قاعدة أوزان الشعر النبطي، مستخرجة حرفيًا من المادة التعليمية التي قدّمها المستخدم (البند 8 من المواصفة). هذه ليست كل أوزان الشعر النبطي في العالم — القاعدة قابلة للتوسعة بإضافة كائن هنا دون لمس كود المحرك. انظر docs/ADDING-A-METER.md",
    "conventions": {
      "feet": "التفعيلات لشطر واحد، لا لبيت كامل. البيت = شطران بنفس النمط.",
      "patternDerivation": "النمط المقطعي لا يُخزَّن — يُشتق آليًا بضم أنماط التفعيلات السالمة في meters/registry.js، حتى لا يتعارض المخزَّن مع المشتق.",
      "expectedSyllableCount": "قيمة تحقق فقط: الاختبارات تفشل إن خالفها الاشتقاق."
    },
    "meters": [
      {
        "id": "al_maskhub",
        "name": "المسحوب",
        "aliases": [],
        "enabled": true,
        "sourceIndex": 1,
        "sourceQuote": "مستفعلن | مستفعلن | فاعلاتن",
        "feet": [
          "mustafilun",
          "mustafilun",
          "failatun"
        ],
        "expectedSyllableCount": 12,
        "status": "OK"
      },
      {
        "id": "al_sakhri",
        "name": "الصخري",
        "aliases": [],
        "enabled": true,
        "sourceIndex": 2,
        "sourceQuote": "مفاعلاتن | مفاعلاتن | فعولن",
        "feet": [
          "mufaalatun_source",
          "mufaalatun_source",
          "faulun"
        ],
        "expectedSyllableCount": 13,
        "status": "NEEDS_VALIDATION",
        "validation": {
          "issue": "تفعيلة «مفاعلاتن» ثمانية أحرف؛ لا تفعيلة خليلية تتجاوز سبعة.",
          "kept": "نُفِّذت كما وردت في المصدر حرفيًا — لم تُصحَّح.",
          "candidates": [
            {
              "feet": [
                "mufaalatun",
                "mufaalatun",
                "faulun"
              ],
              "reading": "مفاعلتن ×2 + فعولن",
              "syllables": 13
            },
            {
              "feet": [
                "mafailun",
                "mafailun",
                "faulun"
              ],
              "reading": "مفاعيلن ×2 + فعولن",
              "syllables": 11
            }
          ],
          "resolvedBy": "بيت صخري واحد حقيقي مع تقطيعه"
        }
      },
      {
        "id": "al_hajini_shamali",
        "name": "الهجيني الشمالي",
        "aliases": [
          "البسيط",
          "الهجيني الشمالي / البسيط"
        ],
        "enabled": true,
        "sourceIndex": 3,
        "sourceQuote": "مستفعلن | فاعلن | مستفعلن | فعلن",
        "feet": [
          "mustafilun",
          "failun",
          "mustafilun",
          "failun_short"
        ],
        "expectedSyllableCount": 14,
        "status": "OK",
        "note": "يوافق البسيط المخبون. التفعيلة الأخيرة «فعلن» غير مشكولة في المصدر، فتُقرأ فَعِلُنْ أو فَعْلُنْ — كلتاهما مسموحة عبر variation لا عبر تخمين."
      },
      {
        "id": "al_hajini",
        "name": "الهجيني",
        "aliases": [],
        "enabled": true,
        "sourceIndex": 4,
        "sourceQuote": "فاعلاتن | فعولن | فاعلاتن | فعولن",
        "feet": [
          "failatun",
          "faulun",
          "failatun",
          "faulun"
        ],
        "expectedSyllableCount": 14,
        "status": "OK",
        "note": "هذا وحده يحمل اسم «الهجيني» مجرَّدًا في المصدر، فهو الذي يستقبل الاسم المجرَّد عند البحث."
      },
      {
        "id": "al_hajini_qaseer",
        "name": "الهجيني القصير",
        "aliases": [],
        "enabled": true,
        "sourceIndex": 5,
        "sourceQuote": "مستفعلن | فاعلن | فعلن",
        "feet": [
          "mustafilun",
          "failun",
          "failun_short"
        ],
        "expectedSyllableCount": 10,
        "status": "OK"
      },
      {
        "id": "al_hajini_majzu_3",
        "name": "الهجيني مجزوء بثلاث تفعيلات",
        "aliases": [],
        "enabled": true,
        "sourceIndex": 6,
        "sourceQuote": "فاعلاتن | فاعلاتن | فاعلاتن",
        "feet": [
          "failatun",
          "failatun",
          "failatun"
        ],
        "expectedSyllableCount": 12,
        "status": "OK",
        "note": "نمطه بادئة حرفية لنمط al_hajini_majzu_4 — التمييز بينهما يقع بتكلفة المقاطع الزائدة في المطابق."
      },
      {
        "id": "al_hajini_majzu_4",
        "name": "الهجيني مجزوء بأربع تفعيلات",
        "aliases": [],
        "enabled": true,
        "sourceIndex": 7,
        "sourceQuote": "فاعلاتن | فاعلاتن | فاعلاتن | فاعلاتن",
        "feet": [
          "failatun",
          "failatun",
          "failatun",
          "failatun"
        ],
        "expectedSyllableCount": 16,
        "status": "OK"
      },
      {
        "id": "al_hazaj",
        "name": "الهزج",
        "aliases": [
          "الشيباني",
          "اللويحاني"
        ],
        "enabled": true,
        "sourceIndex": 8,
        "sourceQuote": "مفاعيلن | مفاعيلن | مفاعيلن | مفاعيلن",
        "feet": [
          "mafailun",
          "mafailun",
          "mafailun",
          "mafailun"
        ],
        "expectedSyllableCount": 16,
        "status": "OK",
        "note": "الأسماء الثلاثة لوزن واحد حسب المادة المصدرية، فحُفظت aliases لا بحورًا منفصلة."
      },
      {
        "id": "al_mankus",
        "name": "المنكوس",
        "aliases": [],
        "enabled": true,
        "sourceIndex": 9,
        "sourceQuote": "فعولن | مفاعيلن | فعولن | مفاعيلن",
        "feet": [
          "faulun",
          "mafailun",
          "faulun",
          "mafailun"
        ],
        "expectedSyllableCount": 14,
        "status": "OK"
      },
      {
        "id": "al_rajaz",
        "name": "الرجز",
        "aliases": [],
        "enabled": true,
        "sourceIndex": 10,
        "sourceQuote": "مستفعلن | مستفعلن | مستفعلن | مستفعلن",
        "feet": [
          "mustafilun",
          "mustafilun",
          "mustafilun",
          "mustafilun"
        ],
        "expectedSyllableCount": 16,
        "status": "OK",
        "note": "الرجز الخليلي التام ثلاث مستفعلن لكل شطر، والمصدر يقول أربعًا. نُفِّذ كما ورد لأن المصدر يعضد نفسه: البند 11 يجعل الحدا (مستفعلن ×2) «نصف الرجز»، ونصف الأربعة اثنان."
      },
      {
        "id": "al_hada",
        "name": "الحدا",
        "aliases": [
          "الحدائي"
        ],
        "enabled": true,
        "sourceIndex": 11,
        "sourceQuote": "مستفعلن | مستفعلن — وهو نصف الرجز",
        "feet": [
          "mustafilun",
          "mustafilun"
        ],
        "expectedSyllableCount": 8,
        "status": "OK",
        "note": "«الحدائي» مُسجَّل alias بناءً على القائمة القديمة؛ المادة المصدرية الجديدة لا تذكره. NEEDS_VALIDATION على الاسم لا على النمط."
      },
      {
        "id": "al_hilali_taweel",
        "name": "الهلالي الطويل",
        "aliases": [
          "الهلالي"
        ],
        "enabled": false,
        "sourceIndex": 12,
        "sourceQuote": "نفس المسحوب + حرف",
        "feet": null,
        "expectedSyllableCount": null,
        "status": "NEEDS_VALIDATION",
        "derivation": {
          "base": "al_maskhub",
          "sourceDescription": "نفس المسحوب + حرف",
          "why_not_implemented": "«+ حرف» ليس عملية عروضية معرَّفة. زيادة حرف قد تكون ساكنًا (تذييل) أو متحركًا أو حرفًا في الرسم لا في الوزن. نسخ نمط المسحوب كما هو يخالف تعليماتك صراحة، واختراع الفرق يخالف البند 26.",
          "candidates": [
            {
              "id": "tadhyil",
              "label": "تذييل: المسحوب مع زيادة ساكن على آخر الشطر",
              "feet": [
                "mustafilun",
                "mustafilun",
                "failatun"
              ],
              "lastFootVariation": "tadhyil",
              "plausibility": "الأرجح — «+ حرف» تصف التذييل بدقة، وهي علة قياسية تقع في الضرب"
            },
            {
              "id": "extra_sabab",
              "label": "زيادة سبب خفيف في الحشو",
              "feet": null,
              "plausibility": "أقل ترجيحًا — يزيد حرفين لا حرفًا"
            },
            {
              "id": "orthographic_only",
              "label": "الحرف زيادة في الرسم لا في الوزن (الهلالي = المسحوب وزنًا)",
              "feet": [
                "mustafilun",
                "mustafilun",
                "failatun"
              ],
              "plausibility": "ممكن — وعندها الوزنان لا يُفرَّق بينهما آليًا إطلاقًا"
            }
          ],
          "resolvedBy": "بيتان: واحد هلالي طويل وواحد مسحوب، مع تقطيع كلٍّ منهما من تطبيق ميزان النبط. الفرق بينهما يحسم المرشَّح.",
          "howToEnable": "اضبط enabled=true، وانقل feet ولا lastFootVariation المرشَّح المعتمد إلى أعلى الكائن، ثم أضف golden case له."
        }
      },
      {
        "id": "al_madeed",
        "name": "المديد",
        "aliases": [],
        "enabled": true,
        "sourceIndex": 13,
        "sourceQuote": "فاعلاتن | فاعلن | فاعلاتن | فاعلن",
        "feet": [
          "failatun",
          "failun",
          "failatun",
          "failun"
        ],
        "expectedSyllableCount": 14,
        "status": "OK",
        "note": "المديد الخليلي التام فاعلاتن فاعلن فاعلاتن لكل شطر. المصدر يذكر أربع تفعيلات، ونُفِّذ كما ورد."
      }
    ],
    "notInSource": [
      {
        "name": "السامري",
        "reason": "ورد في القائمة القديمة (6 بحور) ولم يرد في المادة المصدرية الجديدة (13 بحرًا). لم يُنفَّذ لأنه لا توجد له تفعيلات في أي مصدر قدّمته — وليس لأنه أُسقط. أعطني تفعيلاته يُضَف بسطر واحد هنا دون كود.",
        "status": "MISSING_SOURCE"
      }
    ]
  },
  "scoring": {
    "version": 1,
    "description": "معاملات معادلة الدرجة. ملف مستقل عمدًا: تعديل أي رقم هنا يغيّر الترتيب دون إعادة بناء المحرك. المعادلة نفسها موثّقة في docs/SCORING.md ولا تقرأ أي رقم من خارج هذا الملف.",
    "weights": {
      "substitution": 1,
      "insertion": 1.2,
      "deletion": 1.2,
      "overlongMismatch": 0.3,
      "variationKind": {
        "salim": 0,
        "ambiguous_reading": 0.05,
        "zihaf": 0.12,
        "illa": 0.18
      },
      "severityMultiplier": {
        "1": 1,
        "2": 1.8
      },
      "scopeViolation": 0.5,
      "position": {
        "first": 1.1,
        "hashw": 1,
        "arudDarb": 1.35
      },
      "unconsumedSyllable": 1.2,
      "unfilledFoot": 1.5
    },
    "normalizer": {
      "mode": "meterSyllables",
      "perSyllableCost": 1,
      "floor": 4
    },
    "uncertainty": {
      "assumedVocalizationPenalty": 0.08,
      "unknownWordPenalty": 0,
      "ambiguityPenalty": 0.25,
      "tieDelta": 0.03
    },
    "thresholds": {
      "sound": 0.97,
      "acceptable": 0.85,
      "broken": 0.6,
      "maxBrokenFootRatio": 0.5
    },
    "brokenFoot": {
      "minCostToReport": 0.25
    },
    "ranking": {
      "maxAlternatives": 5,
      "minScoreToList": 0.35
    },
    "rationale": {
      "insertion_gt_substitution": "زيادة مقطع أو نقصه يغيّر بنية الشطر أكثر مما يغيّره تبدّل كمّية مقطع واحد، فكلفته أعلى.",
      "arudDarb_gt_hashw": "الخلل في العروض والضرب أشدّ إخلالًا بالسمع من مثله في الحشو، والعرف العروضي يشدّد فيهما.",
      "zihaf_not_free": "الزحاف مسموح لا مُستحبّ؛ تكلفته الصغيرة تجعل القراءة السالمة تتقدّم على المزاحَفة عند تساوي كل شيء آخر، دون أن تُسقط المزاحَفة.",
      "overlong_cheap": "التمييز بين المقطع الطويل والمفرط في آخر الشطر مسألة اصطلاح تدوين غالبًا، فلا يُعامَل معاملة الخطأ الكامل.",
      "normalizer_floor": "يمنع البحور القصيرة جدًا من تضخيم أثر خطأ واحد.",
      "ambiguity_penalty": "نصّ غير مشكول يقبل قراءات كثيرة، فقد يتساوى بحران في القمة. الدرجة تبقى كما هي — لأنها تصف المطابقة فعلًا — لكن الثقة تنخفض، لأن الثقة تصف يقيننا بالإجابة لا جودة المطابقة. الفرق بين الرقمين مقصود.",
      "tie_delta": "الفارق الذي يُعدّ دونه البحران متساويين. مشتق من كلفة زحاف واحد تقريبًا لا من التجربة — يُعاير حين تتوفر أمثلة مرجعية.",
      "max_broken_foot_ratio": "الدرجة وحدها لا تكفي للحكم. بيت اختلّت فيه كل تفعيلاته قد ينال درجة متوسطة لأن كل تفعيلة اختلّت بمقطع واحد فقط، فيبدو «قريبًا من البحر» وهو ليس كذلك: القرب من وزن معناه أن أكثره صحيح. فإذا تجاوزت نسبة التفعيلات المختلّة هذا الحدّ رُدَّ الحكم إلى «لا وزن مقنع» مهما كانت الدرجة. الدرجة تصف المسافة، والحكم يصف ما يصحّ أن يُقال للمستخدم."
    }
  },
  "encodings": {
    "description": "ترميزات النمط الرقمي. البند 10 من المواصفة يمنع افتراض معنى الأرقام، لذلك لا يوجد تحويل مثبَّت في الكود إطلاقًا: التمثيل الداخلي حروف (S/L/X)، وكل ترميز رقمي مجرد عارض يُقرأ من هنا.",
    "internal": {
      "note": "التمثيل الداخلي الوحيد الذي يعمل عليه المطابق والمُقيِّم. لا يُعرَض للمستخدم ولا يُستبدل.",
      "symbols": {
        "S": "مقطع قصير — صامت + حركة قصيرة (CV)",
        "L": "مقطع طويل — CVC أو CVV",
        "X": "مقطع مفرط الطول — CVVC أو CVCC، لا يقع إلا في آخر الشطر"
      }
    },
    "defaultScheme": "binary_1_2",
    "schemes": [
      {
        "id": "binary_1_2",
        "name": "ثنائي (1 قصير / 2 طويل)",
        "status": "PROVISIONAL",
        "level": "syllable",
        "map": {
          "S": "1",
          "L": "2",
          "X": "3"
        },
        "separator": "",
        "note": "ترميز عرض افتراضي اخترته للوضوح فقط. ليس ادّعاءً بأنه ترميز تطبيق ميزان النبط — انظر nabati_app أدناه."
      },
      {
        "id": "khalil_arudi",
        "name": "الترميز الخليلي الحرفي (متحرك/ساكن)",
        "status": "STANDARD",
        "level": "letter",
        "map": {
          "moving": "1",
          "still": "0"
        },
        "separator": "",
        "note": "هذا ترميز عروضي كلاسيكي موثّق: كل حرف متحرك 1 وكل ساكن 0. يُشتق من الحروف لا من المقاطع، فهو مستقل عن الترميز المقطعي وصالح للتحقق المتقاطع."
      },
      {
        "id": "arudi_slash",
        "name": "الرمز التقليدي (/ و ه)",
        "status": "STANDARD",
        "level": "letter",
        "map": {
          "moving": "/",
          "still": "ه"
        },
        "separator": "",
        "note": "نفس المستوى الحرفي بعلامات كتب العروض."
      },
      {
        "id": "nabati_app",
        "name": "ترميز تطبيق ميزان النبط",
        "status": "NEEDS_VALIDATION",
        "level": null,
        "map": null,
        "separator": null,
        "enabled": false,
        "note": "غير مُنفَّذ عمدًا. المواصفة تقول إن المادة المصدرية والتطبيق يستخدمان تمثيلًا رقميًا، وتمنع افتراض معناه.",
        "resolvedBy": [
          "٣ لقطات على الأقل من التطبيق، كل واحدة تُظهر بيتًا وناتجه الرقمي",
          "يُفضَّل أن تكون من بحور مختلفة الطول (مثلًا الحدا والمسحوب والرجز) حتى نميّز هل الرقم لكل مقطع أم لكل حرف أم لكل تفعيلة"
        ],
        "howToEnable": "املأ level (syllable أو letter) و map، واضبط enabled=true، وأضف حالة golden واحدة على الأقل تثبّت الاشتقاق. لا يلزم تعديل أي كود."
      }
    ]
  },
  "lexicon": {
    "description": "الاستثناءات التي لا يمكن اشتقاقها من الرسم: حروف تُكتب ولا تُنطق، وحروف تُنطق ولا تُكتب، وكلمات همزتها همزة وصل. كل مدخل قاعدة صوتية لا تخمين معنى.",
    "silentLetters": {
      "note": "حرف مكتوب غير منطوق — لا يُحتسب في الوزن (البند 5: الحذف الصوتي).",
      "rules": [
        {
          "id": "waw_al_jamaa",
          "name": "ألف التفريق بعد واو الجماعة",
          "pattern": "و+ا في آخر الفعل",
          "regex": "وا$",
          "appliesTo": "verbs",
          "action": "drop_final_alif",
          "examples": [
            "كتبوا",
            "قالوا",
            "راحوا",
            "جاؤوا"
          ],
          "status": "OK"
        },
        {
          "id": "amr_waw",
          "name": "واو عمرو",
          "words": [
            "عمرو"
          ],
          "action": "drop_final_waw",
          "status": "OK"
        }
      ]
    },
    "unwrittenLongVowels": {
      "note": "ألف تُنطق ولا تُكتب. تؤثر في الوزن لأنها تُطيل المقطع.",
      "words": {
        "هذا": "هَاذَا",
        "هذه": "هَاذِهِ",
        "هذان": "هَاذَانِ",
        "ذلك": "ذَالِكَ",
        "ذلكم": "ذَالِكُمْ",
        "أولئك": "أُلَائِكَ",
        "هؤلاء": "هَاؤُلَاءِ",
        "لكن": "لَاكِنْ",
        "لكنّ": "لَاكِنَّ",
        "الله": "اللَّاه",
        "اللهم": "اللَّاهُمَّ",
        "الرحمن": "الرَّحْمَان",
        "طه": "طَاهَا",
        "إله": "إِلَاه"
      },
      "status": "OK",
      "note2": "«لكن» المخففة تُنطق لَاكِنْ بألف. أضِف ما ينقص هنا دون كود."
    },
    "hamzatWasl": {
      "note": "همزة الوصل تسقط عند الوصل بما قبلها. أل التعريف تُعالَج بقاعدة مستقلة في المُصوِّت لا هنا.",
      "words": [
        "ابن",
        "ابنة",
        "ابنان",
        "اسم",
        "امرؤ",
        "امرأة",
        "اثنان",
        "اثنتان",
        "است",
        "ايم",
        "ايمن"
      ],
      "verbPrefixes": {
        "note": "أفعال الأمر والماضي الخماسي والسداسي ومصادرها تبدأ بهمزة وصل.",
        "detection": "TODO_HEURISTIC",
        "status": "NEEDS_VALIDATION",
        "why": "التمييز بين همزة الوصل وهمزة القطع في فعل غير مشكول يحتاج تحليلًا صرفيًا. المحرك حاليًا يعامل الألف الابتدائية غير المهموزة في غير الكلمات المذكورة أعلاه على أنها همزة قطع، ويسجّل ذلك في التتبّع."
      }
    },
    "knownVocalizations": {
      "note": "كلمات وظيفية نطقها مستقرّ لا خلاف فيه. الفائدة عملية: النصّ النبطي يُكتب غير مشكول غالبًا، وكل حرف غير مشكول يضاعف احتمالات التقطيع. تثبيت هذه الكلمات وحدها يقلّص الاحتمالات تقليصًا كبيرًا دون أي تخمين — فهذه أنطاق مقرَّرة لا اجتهاد.",
      "scope": "أدوات وحروف معانٍ فقط. لا تُضَف هنا أسماء ولا أفعال: نطقها يتغيّر بالإعراب والسياق.",
      "words": {
        "من": "مِنْ",
        "عن": "عَنْ",
        "في": "فِي",
        "ما": "مَا",
        "لا": "لَا",
        "يا": "يَا",
        "هل": "هَلْ",
        "قد": "قَدْ",
        "بل": "بَلْ",
        "لم": "لَمْ",
        "لن": "لَنْ",
        "أن": "أَنْ",
        "إن": "إِنْ",
        "أو": "أَوْ",
        "ثم": "ثُمَّ",
        "كل": "كُلّ",
        "على": "عَلَى",
        "إلى": "إِلَى",
        "حتى": "حَتَّى",
        "الذي": "الَّذِي",
        "التي": "الَّتِي",
        "اللي": "اللِّي",
        "الا": "إِلَّا",
        "إلا": "إِلَّا",
        "عند": "عِنْدَ",
        "بين": "بَيْنَ",
        "فوق": "فَوْقَ",
        "تحت": "تَحْتَ",
        "غير": "غَيْر",
        "بعد": "بَعْد",
        "قبل": "قَبْل",
        "كان": "كَان",
        "يكون": "يَكُون"
      },
      "status": "OK",
      "howToExtend": "أضف مدخلًا: المفتاح الرسم المجرّد، والقيمة النطق مشكولًا. لا يلزم كود."
    },
    "sunLetters": [
      "ت",
      "ث",
      "د",
      "ذ",
      "ر",
      "ز",
      "س",
      "ش",
      "ص",
      "ض",
      "ط",
      "ظ",
      "ل",
      "ن"
    ],
    "taMarbuta": {
      "note": "التاء المربوطة تُنطق تاءً عند الوصل، وهاءً أو تُسكَّن عند الوقف.",
      "midLine": "t",
      "lineEnd": "h",
      "status": "OK"
    },
    "nabatiDialect": {
      "note": "ظواهر نطقية نبطية تؤثر في الوزن. فارغة عمدًا — البند 26 يمنع اختراع قواعد. تُملأ من أمثلة حقيقية.",
      "rules": [],
      "status": "NEEDS_VALIDATION",
      "knownGaps": [
        "إمالة الألف في بعض اللهجات — هل تغيّر كمّية المقطع؟ الأرجح لا، لكنها غير مؤكدة",
        "تسكين أواخر الكلمات في النبطي أكثر منه في الفصيح — يؤثر مباشرة في المقاطع، ويحتاج أمثلة مقطَّعة",
        "الكشكشة والكسكسة — لا أثر وزني متوقَّع لكنها غير محسومة",
        "حذف همزة القطع في أول الكلمة في النطق العامي"
      ]
    }
  },
  "goldenCases": {
    "description": "حالات مرجعية للمحرك نفسه، لا لواجهة أي تطبيق. كل حالة مستقلة وقابلة للتشغيل وحدها.",
    "conventions": {
      "syllables": "S قصير، L طويل، X مفرط الطول",
      "source": "hand_verified = قطّعتُها يدويًا بقواعد العروض قبل تشغيل المحرك | app = من تطبيق ميزان النبط | derived = مشتقّة من البيانات نفسها",
      "note": "أي حالة مصدرها app لم تُضَف بعد — لم يُقدَّم شيء منها. القسم pending يبيّن ما ينقص."
    },
    "phonology": [
      {
        "id": "shadda_splits",
        "title": "المشدّد ساكن + متحرك",
        "input": "مَدَّ",
        "expectSyllables": [
          "L",
          "L"
        ],
        "why": "مَدْ + دَ، والفتحة الأخيرة تُشبَع في آخر الشطر",
        "source": "hand_verified"
      },
      {
        "id": "tanween_is_noon",
        "title": "التنوين نون ساكنة",
        "input": "كِتَابٌ",
        "expectSyllables": [
          "S",
          "L",
          "L"
        ],
        "why": "كِ + تَا + بُنْ — وهي بعينها فَعُولُنْ",
        "source": "hand_verified"
      },
      {
        "id": "lam_shamsiyya",
        "title": "اللام الشمسية لا تُنطق والحرف بعدها مشدّد",
        "input": "الشَّمْسُ",
        "expectSyllables": [
          "L",
          "L",
          "L"
        ],
        "why": "أَشْ + شَمْ + سُ ← ثلاثة مقاطع، وإشباع الضمة يجعل الأخير طويلًا",
        "source": "hand_verified"
      },
      {
        "id": "lam_qamariyya",
        "title": "اللام القمرية تُنطق",
        "input": "الْقَمَرُ",
        "expectSyllables": [
          "L",
          "S",
          "S",
          "L"
        ],
        "why": "أَلْ + قَ + مَ + رُ ← الميم مفتوحة مقطعًا مفتوحًا، والراء تُشبَع",
        "source": "hand_verified"
      },
      {
        "id": "madd_letters",
        "title": "حروف المدّ تُطيل المقطع",
        "input": "قَالُوا",
        "expectSyllables": [
          "L",
          "L"
        ],
        "why": "قَا + لُو، وألف التفريق غير منطوقة",
        "source": "hand_verified"
      },
      {
        "id": "silent_alef_jamaa",
        "title": "ألف التفريق لا تُحتسب",
        "input": "كَتَبُوا",
        "expectSyllables": [
          "S",
          "S",
          "L"
        ],
        "why": "كَ + تَ + بُو — ثلاثة مقاطع لا أربعة",
        "source": "hand_verified"
      },
      {
        "id": "diphthong_bayt",
        "title": "اللين يغلق المقطع",
        "input": "بَيْتٌ",
        "expectSyllables": [
          "L",
          "L"
        ],
        "why": "بَيْ + تُنْ",
        "source": "hand_verified"
      },
      {
        "id": "wasl_shortens_madd",
        "title": "التقاء الساكنين يقصر حرف المدّ",
        "input": "فِي الْبَيْتِ",
        "expectSyllables": [
          "L",
          "L",
          "L"
        ],
        "why": "فِلْ + بَيْ + تِ ← ياء «في» تسقط عند التقاء الساكنين، والكسرة تُشبَع",
        "source": "hand_verified"
      },
      {
        "id": "hamzat_wasl_line_start",
        "title": "همزة الوصل تُنطق في أول الشطر",
        "input": "الْبَيْتُ",
        "expectSyllables": [
          "L",
          "L",
          "L"
        ],
        "why": "أَلْ + بَيْ + تُ ← وإشباع الضمة يجعل الأخير طويلًا",
        "source": "hand_verified"
      },
      {
        "id": "unwritten_alef",
        "title": "ألف تُنطق ولا تُكتب",
        "input": "هذا",
        "expectSyllables": [
          "L",
          "L"
        ],
        "why": "هَا + ذَا",
        "source": "hand_verified"
      },
      {
        "id": "lam_qamariyya_sukun",
        "title": "اللام القمرية مع سكون آخر الشطر = فاعلن",
        "input": "الْقَمَرْ",
        "expectSyllables": [
          "L",
          "S",
          "L"
        ],
        "why": "أَلْ + قَ + مَرْ — نمط فَاعِلُنْ بعينه",
        "source": "hand_verified"
      },
      {
        "id": "overlong_at_line_end",
        "title": "المقطع المفرط الطول لا يقع إلا في آخر الشطر",
        "input": "كِتَابْ",
        "expectSyllables": [
          "S",
          "X"
        ],
        "why": "كِ + تَابْ ← التقاء الساكنين جائز في آخر الشطر فيبقى المقطع مفرطًا (X). ووسط الشطر يقصر حتمًا إلى L، وهو ما تختبره حالة wasl_shortens_madd.",
        "source": "hand_verified"
      }
    ],
    "meterSelfCheck": {
      "description": "كل بحر يجب أن يطابق نمطه هو بدرجة تامة. تُشتق آليًا من meters.json فلا تحتاج صيانة عند إضافة بحر.",
      "requiredScore": 1
    },
    "verses": [],
    "pending": {
      "description": "ما ينقص لإكمال مجموعة الاختبار. كل بند هنا يمنع تثبيت قاعدة ما.",
      "items": [
        {
          "need": "٣ أبيات على الأقل لكل بحر من البحور الاثني عشر المفعَّلة، مع تقطيعها من تطبيق ميزان النبط",
          "unblocks": "حالات verses الحقيقية، ومعايرة أوزان scoring.json على سلوك مرجعي"
        },
        {
          "need": "بيت صخري واحد مقطَّع",
          "unblocks": "حسم تفعيلة «مفاعلاتن» بين ما ورد وبين مفاعلتن ومفاعيلن"
        },
        {
          "need": "بيت هلالي طويل + بيت مسحوب، مقطَّعان",
          "unblocks": "تفعيل الهلالي الطويل — معطَّل الآن"
        },
        {
          "need": "٣ لقطات تُظهر النمط الرقمي في التطبيق لبحور مختلفة الطول",
          "unblocks": "ترميز nabati_app في encodings.json"
        },
        {
          "need": "تفعيلات السامري",
          "unblocks": "إعادة البحر المفقود من القائمة القديمة"
        },
        {
          "need": "أبيات نبطية عامية فيها تسكين أواخر الكلمات",
          "unblocks": "قواعد اللهجة في lexicon.nabatiDialect — فارغة عمدًا"
        }
      ]
    }
  }
};
export default DATA;
