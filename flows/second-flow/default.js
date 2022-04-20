module.exports = {
    question: "Enerjik misiniz?", // Sayfa için sorulacak soru
    type: "fetch", // Fetch kalması mecburi service için
    variable: "isTired",
    defaultNext: "service",
    service: function (socket, input, variables, setVariable){ // Çalıştırılacak fonksiyon, argümanların bu şekilde kalması gerekli
        console.log(input)
        console.log(variables)
        console.log(setVariable)
        console.log(socket.id)

        return { // Aynı next'leri fonksiyondaki iflerin vs sonucunda göre return etmemiz gerekli, böylece yapılan request'in sonucunda göre işlem yapabilirsiniz.
            next: "answer",
            answer: "OK"
        }
    }
}