# פסאודו-קוד של המעבדות

הניב רץ באמת. הבודק לא מחפש מחרוזות בקובץ. מילות המפתח באנגלית. מחרוזות יכולות להיות בעברית.

## תחביר

```
# הערה
set name to expression
if expression then
  ...
else
  ...
end
while expression
  ...
end
return expression
```

ביטויים: מחרוזות במרכאות כפולות או יחידות, מספרים, `true` / `false`, גישה לשדה `input.resume`, קריאה `model.complete(system_prompt, input.resume)`, אובייקט `{ label: decision }`, `and` / `or` / `not`, השוואות `==` `!=` `<` `>` `<=` `>=`, והאופרטור `contains`.

`json.parse` ו-`json.stringify` ו-`length` זמינים בלי רשת.

## משתנים שהריצה מזריקה

- `system_prompt` תוכן קובץ הפרומפט
- `lock_json` תוכן `lock.json` אם קיים
- `input` קלט התרחיש
- `session` זהות מהשרת: `userId`, `role`, `department`
- `limits` ספי המעבדה, למשל `maxInput`, `dailyLimit`, `loopCap`

## אותם רעיונות של ה-SDK

`model.complete`, `model.extract`, `model.complete_capped`, `text.strip_hidden`, `text.only_verbatim`, `resume.decide`, `customers.load_all`, `customers.load_self`, `packages.load_latest`, `packages.load_locked`, `examples.*`, `html.sanitize`, `mail.*`, `transfers.*`, `secrets.current_key`, `prompt.render`, `vectors.search`, `vectors.only_allowed`, `policy.quote_exact`, `policy.eligible`, `orders.issue_voucher`, `orders.open_ticket`, `budget.allow`.

קוד פגיע קורא למודל וסומך על מה שחזר. תיקון נכון משתמש בבקרות דטרמיניסטיות בצד הקוד. משפט בפרומפט בלבד לא משנה את ההתנהגות מול המודל העוין.
