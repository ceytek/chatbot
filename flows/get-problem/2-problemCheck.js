module.exports = {
  question: "{{problem}} probleminiz var doğru mudur?", // Sayfa için sorulacak soru
  type: "selection", // Türü, selection'da içerisinde geçen kelimelere göre farklı yönlendirmeler yapılırken fetch'te sorunun cevabı kaydedilip defaultNext'e devam edilir.
  variable: "isHappy", // Daha sonradan refer etmek için kullanılacak variable ismi
  defaultNext: "return", // Hiç bir cevap conditionu meet edilemezse bu action gerçekleşecek
  errorMessage: "Lütfen evet veya hayır olarak cevaplayın.", // Return parametresi errorMessage ile verilen hatayı yazdırıp aynı page'i tekrar çalıştırır
  answers: [
    // Gelebilecek cevap seçenekleri, sadece selection için
    {
      value: "h", // Cevabın seçilmesi için içinde geçmesi gereken değer
      next: "route", // Cevap seçilirse yapılacak eylem
      nextRoute: "default", // Sonraki Route, eğer next: "flow" olsaydı nextFlow: flowId olmalıydı
    },
    {
      value: "Evet",
      next: "flow", // bu next action verildiğinde, aşağıda verilen cevap verilip flow bitirilir.
      nextFlow: "check-bildirim",
    },
  ],
};
