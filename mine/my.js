let graphData_My = {}

// 类别按钮
let categoryButton = new Vue({
    el: '#categoryButton',
    data: {
        nodeCategoryArr: [],
        linkTypeArr: [],
    },
    methods: {
        nodeButtonClick(item) {
            item.show = !item.show
            changeNodeVisual(item, this.nodeCategoryArr)
        },
        linkButtonClick(item) {
            item.show = !item.show
        }
    }
})

// 显示hover信息
let hoverInfo = new Vue({
    el: '#hoverInfo',
    data: {
        type: '',
        properties: {},
        id: '',
        isLink: false,
        color: '',
        show: false
    },
    computed: {
        styleObject() {
            return {
                'border-color': this.color + '!important',
                'background-color': this.isLink ? '' : this.color + '!important',
                color: this.isLink ? this.color + '!important' : 'white!important'
            }
        }
    }
})

// 扩展查询
let expandSearch = new Vue({
    el:'#expandSearch',
    data:{
        keyword:'',
        expandItems:['Node ID', 'Edge ID', 'Node Label', 'Edge Label']
    },
    methods:{
        runExpandSearch(idx){
            cypherQuery.excuteItem(idx)
        }
    }
})

// cyphey查询
let cypherQuery = new Vue({
    el: '#cypherQuery',
    data: {
        queryFinish: true,
        cypher: '',
        hasError: false,
        reqEmpty:false,
        command:'',
    },
    computed: {
        classObject: function () {
            return {
                loading: !this.queryFinish,
                red: this.hasError
            }
        }
    },
    watch: {
        cypher: function (v) {
            if (v.length == 0) {
                this.hasError = false
            }
            expandSearch.keyword = v
        }
    },
    methods: {
        excuteQuery() {
            if(this.command.length < 1 && this.cypher.length < 1){
                return
            }
            let _this = this
            this.queryFinish = false

            let body = { 'cypher': this.command ? this.command : this.cypher  }
            axios.post('http://localhost:8080/excute', body).then(res => {
                _this.queryFinish = true
                console.log(res.data)
                if (res.data.error) {
                    console.log('error')
                    _this.hasError = true
                } else {
                    let commingData = res.data
                    if(commingData.nodes.length < 1){
                        _this.hasError = true
                        return
                    }
                    if (commingData.nodes.length === 1) {
                        commingData.nodes[0].focus = true
                    }

                    _this.hasError = false
                    commingData.nodes.forEach(n => {
                        n.newComming = true
                    })
                    let od = Graph.graphData()
                    filterData(od, commingData, updateGraph, recoverHighLightNode)
                }
            })
        },
        excuteItem(idx){
            if(this.cypher.length < 1){
                return
            }
            if(idx === 0){
                this.command = `match (a) where id(a) = ${this.cypher} return a`
            }
            if(idx === 1){
                this.command = `match (a)-[r]-(b) where id(r) = ${this.cypher} return a,r,b`
            }
            if(idx === 2){
                this.command = `match (a:\`${this.cypher}\`) return a limit 10`
            }
            if(idx === 3){
                this.command = `match (a)-[r:\`${this.cypher}\`]-(b) return a,r,b limit 10`
            }
            this.excuteQuery()
            this.command = ''
        },
    }
})




function recoverHighLightNode() {
    setTimeout(deleteHighLight, 5000)
    function deleteHighLight() {
        let od = Graph.graphData()
        od.nodes.forEach(n => {
            if (n.newComming) {
                delete n.newComming
            }
        })
    }
}

function showHoverInfo(data) {
    if (!data) {
        return
    }
    if (!hoverInfo.type) {
        hoverInfo.show = false
    }
    hoverInfo.show = true
    hoverInfo.isLink = data.hasOwnProperty('type')
    hoverInfo.type = data.type ? data.type : data.category
    hoverInfo.properties = {}
    Object.assign(hoverInfo.properties, data.properties)
    hoverInfo.id = data.id
    hoverInfo.color = data.color
}

function ButtonVisual(graphData) {
    graphData_My = graphData
    // 筛选node和link类别
    filterNodeAndLinkType(graphData, categoryButton)
}

/**
 * 判断数组是否存在object,返回所在的索引
 * @param {*} arr
 * @param {*} object
 */
function existObject(arr, object) {
    for (let i = 0; i < arr.length; i++) {
        if (_.isEqual(arr[i], object)) {
            return i
        }
    }
    return -1
}

/**
 * 筛选graphData中node和link的类别
 * @param {*} graphData
 * @param {*} vueInstance
 */
function filterNodeAndLinkType(graphData, vueInstance) {
    let newNodeCategorys = vueInstance.nodeCategoryArr.map(n => n.category)
    let newLinkTypes = vueInstance.linkTypeArr.map(l => l.type)
    graphData.nodes.forEach(n => {
        let o = {
            category: n.category,
            color: n.color,
            show: true
        }
        if (newNodeCategorys.indexOf(o.category) == -1) {
            newNodeCategorys.push(o.category)
            vueInstance.nodeCategoryArr.push(o)
        }
    })
    graphData.links.forEach(l => {
        let o = {
            type: l.type,
            color: l.color,
            show: true
        }
        if (newLinkTypes.indexOf(o.type) == -1) {
            newLinkTypes.push(o.type)
            vueInstance.linkTypeArr.push(o)
        }
    })

    return { newNodeCategorys, newLinkTypes }
}

/**
 * 改变node的可视状态
 * @param {*} activeItem 点击改变的个体
 * @param {*} nodeCategoryArr node的类别
 */
function changeNodeVisual(activeItem, nodeCategoryArr) {
    graphData_My.nodes.map(n => {
        if (n.color == activeItem.color) {
            n.show = activeItem.show
        }
    })

    let invisiableColor = nodeCategoryArr.filter(nc => {
        if (!nc.show) {
            return nc.color
        }
    })
    invisiableColor = invisiableColor.filter(i => i)
    invisiableColor = invisiableColor.map(i => i.color)

    // TODO 重构代码，这里在外部来更改节点的可视状态，然后又将invisiableColor传入内部
    // 内部来判断新添加进图的数据的可视状态。应该统一起来
    Graph.invisiableColor(invisiableColor)
    graphData_My.links.map(l => {
        if (invisiableColor.indexOf(l.source.color) != -1 || invisiableColor.indexOf(l.target.color) != -1) {
            l.show = false
        } else {
            l.show = true
        }
    })
}