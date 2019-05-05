let requestUrl = 'http://localhost:8080/data/1'
// let requestUrl = 'http://localhost:8080/node/1304535'

let graphInfo = { data: {} };
Object.defineProperty(graphInfo, 'data', {
    get: function () {
        return data
    },
    set: function (value) {
        data = value
        console.log('set')
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

            od.nodes.push(...req.data.nodes)
            od.links.push(...req.data.links)
            Graph.graphData(od)
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
    Graph.graphData(insideData)
})

