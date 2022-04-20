var flows = []

const fs = require('fs');

let flowNames = fs.readdirSync('./flows');

flowNames.forEach((flowName) => {
    console.log(`Found flow ${flowName}`)
    var flow = {
        flowId: flowName,
        triggerKeyword: false,
    }
    let pageNames = fs.readdirSync(`./flows/${flowName}`);
    var pagesArray = []
    pageNames.forEach((pageName) => {
        console.log(`Processing page ${pageName} for ${flowName}`)
        let page = require(`./flows/${flowName}/${pageName}`)
        var pageRoute = pageName.split(".")
        pageRoute.pop()
        page.pageRoute = pageRoute.join(".")
        pagesArray.push(page)
    })

    flow.pages = pagesArray

    flows.push(flow)
})

var answerDatabase = {}

/* Terminal'den IO yapmak için  */
const prompt = require('prompt-sync')();
/* Terminal IO konfigürasyon sonu */

const protypa = require('protypa')



while (true) {
    /* Sorunun kullanılan formatta sorulup, cevabın işlenmemiş halinin input variable'ına burada kaydedilmesi gerekli */
    const input = prompt('Merhaba!');
    if (input === "x") {
        process.exit();
    }
    matchFlow(flows, input)
}

/**
 * Kullanıcının girişinin uygun olan ilk input ile eşleştirilmesini sağlayan fonksiyon
 */
function matchFlow(flows, input) {
    let matched = false
    flows.some((flow) => {
        // Bu if sadece string'de bulunup bulunmadığına göre bir flow eşleştiriyor, language processing buraya eklenmeli // 
        if (flow.triggerKeyword && input.toLowerCase().includes(flow.triggerKeyword.toLowerCase())) {
            matched = true
            executeFlow(flows, answerDatabase, flow.flowId)
            return
        }
    })
    if(!matched){
        executeFlow(flows, answerDatabase, "default-flow")
    }
}

/**
 * Flowları yürüten fonksiyon
 */
function executeFlow(flows, answerDatabase, flowId) {

    executePage(flows, answerDatabase, flowId, flows.find(x => x.flowId === flowId).initialRoute || "default")

}

/**
 * Pageleri execute eden fonksiyon
 */
function executePage(flows, answerDatabase, flowId, pageRoute) {

    let flow = flows.find(x => x.flowId === flowId)
    let page = flow.pages.find(x => x.pageRoute === pageRoute)

    /* Sorunun kullanılan formatta sorulup, cevabın işlenmemiş halinin input variable'ına burada kaydedilmesi gerekli */
    const input = prompt(text(page.question, answerDatabase));
    processAnswer(flows, answerDatabase, flowId, page.pageRoute, input)

}

/**
 * Uygun olan cevap ile eşleştirme yapan fonksiyon
 */
function processAnswer(flows, answerDatabase, flowId, pageRoute, input) {

    let flow = flows.find(x => x.flowId === flowId)
    let page = flow.pages.find(x => x.pageRoute === pageRoute)
    let matched = false
    let value = input

    if (page.type === "selection") {
        page.answers.some((answer) => {
            // Bu if sadece string'de bulunup bulunmadığına göre bir cevabı eşleştiriyor, language processing buraya eklenmeli // 
            if (input.toLowerCase().includes(answer.value.toLowerCase())) {
                matched = answer
                return
            }
        })
    }

    if (!matched) {
        matched = {
            next: page.defaultNext,
            nextRoute: page.nextRoute || null,
            errorMessage: page.errorMessage || null,
            nextFlow: page.nextFlow || null,
            answer: page.answer || null,
            service: page.service || null,
            variable: page.variable || null
        }
    }

    if (page.type === "selection") {
        value = matched.value
    }

    answerDatabase[page.variable] = value

    processNext(flows, answerDatabase, flowId, pageRoute, matched)

}

/**
 * Cevaba göre uygun eylemi gerçekleştirecek olan fonksiyon
 */
function processNext(flows, answerDatabase, flowId, pageRoute, matched) {
    switch (matched.next) {
        case "answer":
            /* Bu mesajın kullanıcıya gösterilmesi gerekli */
            console.log(text(matched.answer, answerDatabase) || "No answer specified but the next action is 'answer'.")
            break
        case "return":
            /* Bu mesajın kullanıcıya gösterilmesi gerekli */
            console.log(text(matched.errorMessage, answerDatabase) || "No errorMessage specified but the next action is 'return'.")
            executePage(flows, answerDatabase, flowId, pageRoute)
            break
        case "route":
            executePage(flows, answerDatabase, flowId, matched.nextRoute)
            break
        case "flow":
            executeFlow(flows, answerDatabase, matched.nextFlow)
            break
        case "service":
            let response = matched.service(answerDatabase[matched.variable], answerDatabase, setVariable)
            processNext(flows, answerDatabase, flowId, pageRoute, response)
            break
        default:
            console.log("No action specified.")
    }
}

function text(input, answerDatabase){
    if(!input){
        return input
    }

    return protypa.write(input, answerDatabase);
}

function setVariable(variableName, variableValue){
    answerDatabase[variableName] = variableValue
}