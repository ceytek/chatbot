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
var conversations = {}

const protypa = require('protypa')

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const port = process.env.PORT || 4001;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("frontend/build"));
const path = require("path");
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
});

io.on("connection", (socket) => {
    console.log("New client connected");
    conversations[socket.id] = {
        status: "new"
    }
    socket.on("message", (message) => {
        if(conversations[socket.id].status === "pending_answer"){
            processAnswer(socket, flows, answerDatabase, conversations[socket.id].flowId, conversations[socket.id].pageRoute, message)
        }
        if(conversations[socket.id].status === "new"){
            matchFlow(socket, flows, message)
        }
        if(conversations[socket.id].status === "ended"){
            conversations[socket.id] = {
                status: "new"
            }
        }
    })
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

server.listen(port, () => console.log(`Listening on port ${port}`));

/**
 * Kullanıcının girişinin uygun olan ilk input ile eşleştirilmesini sağlayan fonksiyon
 */
function matchFlow(socket, flows, input) {
    let matched = false
    flows.some((flow) => {
        // Bu if sadece string'de bulunup bulunmadığına göre bir flow eşleştiriyor, language processing buraya eklenmeli // 
        if (flow.triggerKeyword && input.toLowerCase().includes(flow.triggerKeyword.toLowerCase())) {
            matched = true
            executeFlow(socket, flows, answerDatabase, flow.flowId)
            return
        }
    })
    if(!matched){
        executeFlow(socket, flows, answerDatabase, "default-flow")
    }
}

/**
 * Flowları yürüten fonksiyon
 */
function executeFlow(socket, flows, answerDatabase, flowId) {

    executePage(socket, flows, answerDatabase, flowId, flows.find(x => x.flowId === flowId).initialRoute || "default")

}

/**
 * Pageleri execute eden fonksiyon
 */
function executePage(socket, flows, answerDatabase, flowId, pageRoute) {

    let flow = flows.find(x => x.flowId === flowId)
    let page = flow.pages.find(x => x.pageRoute === pageRoute)

    /* Sorunun kullanılan formatta sorulup, cevabın işlenmemiş halinin input variable'ına burada kaydedilmesi gerekli */
    socket.emit("message", text(page.question, answerDatabase, socket.id))
    conversations[socket.id] = {
        status: "pending_answer",
        flowId: flowId,
        pageRoute: page.pageRoute,
    }

}

/**
 * Uygun olan cevap ile eşleştirme yapan fonksiyon
 */
function processAnswer(socket, flows, answerDatabase, flowId, pageRoute, input) {

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

    if(!answerDatabase[socket.id]){
        answerDatabase[socket.id] = {}
    }

    answerDatabase[socket.id][page.variable] = value

    processNext(socket, flows, answerDatabase, flowId, pageRoute, matched)

}

/**
 * Cevaba göre uygun eylemi gerçekleştirecek olan fonksiyon
 */
function processNext(socket, flows, answerDatabase, flowId, pageRoute, matched) {
    switch (matched.next) {
        case "answer":
            /* Bu mesajın kullanıcıya gösterilmesi gerekli */
            socket.emit("message", text(matched.answer, answerDatabase, socket.id) || "No answer specified but the next action is 'answer'.")
            conversations[socket.id] = {
                status: "ended"
            }
            //socket.emit("done", {}) /*Bu line'ı uncomment ederek chat bitince mesajların kapanmasını sağlayabilirsiniz.
            break
        case "return":
            /* Bu mesajın kullanıcıya gösterilmesi gerekli */
            socket.emit("message", text(matched.errorMessage, answerDatabase, socket.id) || "No errorMessage specified but the next action is 'return'.")
            executePage(socket, flows, answerDatabase, flowId, pageRoute)
            break
        case "route":
            executePage(socket, flows, answerDatabase, flowId, matched.nextRoute)
            break
        case "flow":
            executeFlow(socket, flows, answerDatabase, matched.nextFlow)
            break
        case "service":
            let response = matched.service(socket, answerDatabase[socket.id][matched.variable], answerDatabase, setVariable)
            processNext(socket, flows, answerDatabase, flowId, pageRoute, response)
            break
        default:
            console.log("No action specified.")
    }
}

function text(input, answerDatabase, socketId){
    if(!input){
        return input
    }

    return protypa.write(input, answerDatabase[socketId]);
}

function setVariable(socketId, variableName, variableValue){
    answerDatabase[socketId][variableName] = variableValue
}