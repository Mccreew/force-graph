// let requestUrl = 'http://localhost:8080/data/1/1000'
let requestUrl = 'http://localhost:8080/data/all'


let graphInfo = { data: {} };
Object.defineProperty(graphInfo, 'data', {
    get: function () {
        return data
    },
    set: function (value) {
        data = value
        ButtonVisual(data)
        graphDetail.update(data)
    }
})
const Graph = ForceGraph()
    (document.getElementById('graph')).linkCurvature('curvature').width(1800).height(780).backgroundColor('#F9F9F9')
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
            if(req.data.nodes.length == 0 || req.data.links.length == 0){
                return
            }
            filterData(od, req.data, updateGraph)
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
        graphInfo.data = data
    })
    .onNodeHover(n => {
        showHoverInfo(n)
    })
    .onLinkHover(l => {
        showHoverInfo(l)
    })
    .beginFocusNode(n => {
        Graph.centerAt(n.x, n.y, 3000);
        Graph.zoom(8, 1000);
    })



axios.get(requestUrl).then(req => {
    data = req.data
    let insideData = new Object()
    insideData = Object.assign(insideData, data)
    Graph.originData(insideData)
    updateGraph(data)
})

function updateGraph(data, afterUpFunc) {
    // 设置边的曲率
    let worker = new Worker('./setLinkCurvatureWorker.js')
    worker.postMessage(data)
    worker.onmessage = e => {
        Graph.graphData(e.data)
        if(afterUpFunc){
            afterUpFunc()
        }
        worker.terminate()
    }
}

function filterData(od, comming, upGraph, afterUpFunc) {
    let worker = new Worker('./filterWorker.js')
    let data = {
        od, comming
    }
    worker.postMessage({data})
    worker.onmessage = e => {
        upGraph(e.data, afterUpFunc)
        worker.terminate()
    }
}