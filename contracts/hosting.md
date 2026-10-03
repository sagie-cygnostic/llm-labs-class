# אירוח חינמי עם לינק HTTPS

נבדק מול התיעוד הרשמי ב-3 באוקטובר 2026: <https://render.com/docs/free>

## האפשרות

Render Free Web Service. שירות ווב ציבורי עם HTTPS בכתובת `https://<name>.onrender.com`. בתוכנית Free: 0.1 CPU ו-512 MB RAM. אין כרטיס אשראי בתיאור יצירת מופע Free בעמוד הרשמי. נדרש חשבון Render.

Runtime מובנה של Node לא מבטיח ש-`python3` קיים בתהליך. לכן פורסים Dockerfile על בסיס Node שמתקין גם Python, כ-Web Service בתוכנית Free. התהליך של Node יכול לעשות spawn ל-Python בתוך אותו קונטיינר.

## צעדים (לא בוצעו כאן)

1. להעלות את `/workspace/llm-labs` למאגר Git (GitHub / GitLab / Bitbucket). הקוד כרגע רק על המחשב המשותף הזה.
2. להוסיף Dockerfile, למשל `node:20-bookworm` ואז `apt-get install -y python3`, `CMD ["node","server/index.js"]`. `PORT` מגיע מהסביבה. השרת כבר מאזין על `process.env.PORT`.
3. להירשם ל-Render ולחבר את המאגר.
4. New → Web Service → לבחור את המאגר.
5. בתוכנית המחשוב לבחור Free.
6. אחרי הדיפלוי מתקבל לינק HTTPS ציבורי.

## חסם

חשבון Render (ומאגר Git). לא נפתח חשבון ולא בוצע דיפלוי. אם מסך ההרשמה דורש כרטיס, עוצרים ולא ממשיכים.

## מגבלות שחשובות לכיתה

מהעמוד הרשמי:

- שירות Free נרדם אחרי 15 דקות בלי תעבורה, ומתעורר תוך כדקה.
- הדיסק מקומי ונמחק בשינה, בהפעלה מחדש ובדיפלוי. קובץ `data/sessions.json` לא שורד שינה. לשימור צריך שירות נתונים; Postgres חינמי ב-Render פג אחרי 30 יום.
- 750 שעות מופע Free לסביבת עבודה בחודש.
- אין SSH ואין דיסק קבוע בתוכנית Free.
- ייתכן restart בכל רגע.

Oracle Cloud Always Free נותן VM קבוע שיכול להריץ Node ו-Python, אבל דורש אימות בכרטיס אשראי. זו לא האפשרות שנבחרה כאן.
