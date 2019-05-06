let requestUrl = 'http://localhost:8080/data/1/1000'
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
            req.data.nodes.forEach((node, index) => {
                if (nodeIdSet.has(node.id)) {
                    delete req.data.nodes[index]
                } else {
                    nodeIdSet.add(node.id)
                }
            })

            req.data.nodes = req.data.nodes.filter(n => n)
            filterData(od, req.data)

            // req.data.links = filterDuplicateLink(od.links, req.data.links)
            // od.nodes.push(...req.data.nodes)
            // od.links.push(...req.data.links)
            // updateGraph(od)
            // Graph.graphData(od)
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
    Graph.originData(insideData)
    // Graph.graphData(insideData)
    updateGraph(data)
})

function updateGraph(data) {
    // 设置边的曲率
    let worker = new Worker('./setLinkCurvatureWorker.js')
    console.log('requestUrl: ', requestUrl)
    console.log('Graph: ', Graph)
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

function filterDuplicateLink(odLinks, comingLinks) {
    for (let i = 0; i < comingLinks.length; i++) {
        if (!comingLinks[i]) {
            continue
        }
        let { source, target, type, properties, group } = comingLinks[i]
        let base = {
            source_id: typeof (source) == 'object' ? source.id : source,
            target_id: typeof (target) == 'object' ? target.id : target,
            type: type,
            properties: properties,
            group: group
        }
        for (let j = 0; j < odLinks.length; j++) {
            if (!odLinks[j]) {
                continue
            }
            let { source, target, type, properties, group } = odLinks[j]
            let compare = {
                source_id: typeof (source) == 'object' ? source.id : source,
                target_id: typeof (target) == 'object' ? target.id : target,
                type: type,
                properties: properties,
                group: group
            }
            if (_.isEqual(base, compare)) {
                delete comingLinks[i]
            }
        }
    }
    let links = comingLinks.filter(l => l)
    return links
}