module.exports = {
  question: "Sayın {{name}} , size nasıl yardımcı olabilirim?", // Sayfa için sorulacak soru
  type: "fetch", // Türü, selection'da içerisinde geçen kelimelere göre farklı yönlendirmeler yapılırken fetch'te sorunun cevabı kaydedilip defaultNext'e devam edilir.
  variable: "problem", // Daha sonradan refer etmek için kullanılacak variable ismi
  defaultNext: "route",
  nextRoute: "2-problemCheck", // Return parametresi errorMessage ile verilen hatayı yazdırıp aynı page'i tekrar çalıştırır
};
