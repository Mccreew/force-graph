// let requestUrl = 'http://localhost:8080/data/1/5'
let requestUrl = 'http://localhost:8080/data/1/software/1'

let worker = new Worker('./worker.js')
// let requestUrl = 'http://localhost:8080/node/1304535'

let graphInfo = { data: {} };
Object.defineProperty(graphInfo, 'data', {
    get: function () {
        return data
    },
    set: function (value) {
        data = value
        ButtonVisual(data)
    }
})
const Graph = ForceGraph()
    (document.getElementById('graph')).linkCurvature('curvature').width(1800).height(780)
    // .linkDirectionalParticles(2))
    .onNodeClick((n, od) => {
        showHoverInfo(n)
        console.log(n)
        if (n.expand) {
            return
        }
        n.expand = true

        let nodeIdSet = new Set()
        od.nodes.forEach(node => {
            nodeIdSet.add(node.id)
        })

        axios.get('http://localhost:8080/child/' + n.id).then(req => {

            // req.data.links = filterDuplicateLink(od.links, req.data.links)

            filterDuplicateLinkWorker(od.links, req.data.links, function updateGraph(newLink){
                console.log(newLink)
                req.data.nodes.forEach((node, index) => {
                    if (nodeIdSet.has(node.id)) {
                        delete req.data.nodes[index]
                    } else {
                        nodeIdSet.add(node.id)
                    }
                })

                req.data.nodes = req.data.nodes.filter(n => n)
                od.nodes.push(...req.data.nodes)
                od.links.push(...newLink)
                updateGraphAfterSetLinkCurvature(od)
                // Graph.graphData(od)
            })

        })

    })
    .onLinkClick(l => {
        console.log(l)
        showHoverInfo(l)
    })
    .linkDirectionalArrowLength(4)
    .onControlCircleClick((d, od, clickNode) => {

    })
    .onDataChange((data) => {
        // let temp = {}
        // Object.assign(temp, data)
        graphInfo.data = data
        //    console.log(graphInfo)
    })
    .onNodeHover(n => {
        showHoverInfo(n)
    })
    .onLinkHover(l => {
        showHoverInfo(l)
    })



axios.get(requestUrl).then(req => {
    data = req.data
    let insideData = new Object()
    insideData = Object.assign(insideData, data)
    updateGraphAfterSetLinkCurvature(data)
})

/**
 * webWorker 过滤重复的边
 * @param {*} od 图中已有的数据
 * @param {*} comming 即将新添的数据
 * @param {*} callback 回调
 */
function filterDuplicateLinkWorker(od, comming, callback) {
        worker.postMessage({od, comming})

        worker.onmessage = function (event) {
            // console.log('主线程收到的消息： ', event.data)
            comming = event.data
            callback(comming)
        }
}

/**
 * 在设置边的曲率之后更新图
 * @param {*} data 添加到图中的数据
 */
function updateGraphAfterSetLinkCurvature(data){
    let linkCurvatureWorker = new Worker('./setLinkCurvatureWorker.js')
    linkCurvatureWorker.postMessage(data.links)
    linkCurvatureWorker.onmessage = e => {
        console.log('设置边的曲率完成，刷新图')
        data.links = e.data
        Graph.originData(data)
        Graph.graphData(data)
    }
}