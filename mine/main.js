let requestUrl = 'http://localhost:8080/data/1/5'

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

            req.data.nodes.forEach((node, index) => {
                if (nodeIdSet.has(node.id)) {
                    delete req.data.nodes[index]
                } else {
                    nodeIdSet.add(node.id)
                }
            })

            req.data.nodes = req.data.nodes.filter(n => n)
            filterData(od, req.data)
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



axios.get(requestUrl).then(req => {
    data = req.data
    let insideData = new Object()
    insideData = Object.assign(insideData, data)
    Graph.originData(insideData)
    updateGraph(data)
})

function updateGraph(data) {
    // 设置边的曲率
    let worker = new Worker('./setLinkCurvatureWorker.js')
    worker.postMessage(data)
    worker.onmessage = e => {
        Graph.graphData(e.data)
        worker.terminate()
    }
}

function filterData(od, comming) {
    let worker = new Worker('./filterWorker.js')
    let data = {
        od, comming
    }
    worker.postMessage({data})
    worker.onmessage = e => {
        updateGraph(e.data)
        worker.terminate()
    }
}