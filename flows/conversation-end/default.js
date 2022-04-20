module.exports = {
  question: "Bu sorudan sonra conversation bitecek, ne yazarsanız yazın",
  type: "fetch", // bu bir fetch tipi soru, o yüzden ne olursa olsun doğrudan cevap kaydedilip defaultNext çalıştırılacak.
  variable: "tirednessReason",
  defaultNext: "answer",
  answer: "Hoşçakalın!" // Daha sonradan refer etmek için kullanılacak variable ismi
};
