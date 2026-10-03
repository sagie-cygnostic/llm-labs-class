# מעבדות פיתוח מאובטח

שרת הריצה, הבודק ועשר מעבדות OWASP Top 10 for LLM Applications 2025. הממשק הוויזואלי לא כאן.

## הרצה

```bash
cd /workspace/llm-labs
npm start
```

השרת מאזין על `http://127.0.0.1:8787`. אפשר `PORT=8787`.

## בדיקות

```bash
cd /workspace/llm-labs
npm test
```

הסקריפט מרים את השרת, קורא לנתיבי הכיתה, ובודק את LLM01 בשלוש השפות ואת שאר המעבדות (תיקון ייחוס וגם תיקון שהוא רק פרומפט).

## מה לא לדרוס

הסוכן של הממשק לא נוגע ב:

- `server/` `runner/` `checker/` `labs/` `contracts/` `tests/` `data/`
- `package.json` `README.md`

`shared/api.ts` ו-`web/` שייכים לממשק. אל תשנו אותם מכאן.

חוזה ה-API: `contracts/api.md` (זהה ל-`shared/api.ts`).
פסאודו-קוד: `contracts/pseudocode.md`.
אירוח: `contracts/hosting.md`.
