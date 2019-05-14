import * as _ from "lodash/lang";

/**
 * 得到一个节点有多少条边
 * @param {*} nodeId node的id
 * @param {*} links 所有的边
 */
function getLinkCount(nodeId, links) {
    let count = 0
    links.forEach(l => {
        if (l.source.id == nodeId || l.target.id == nodeId) {
            count += 1
        }
    });
    return count
}

/**
 * node是否有和targetNode以外的边的联系
 * @param {*} nodeId
 * @param {*} links
 * @param {*} targetNodeId
 */
function hasAnotherLink(nodeId, links, targetNodeId) {
    let flag = false
    for (let i = 0; i < links.length; i++) {
        const l = links[i];
        if (l.source.id == nodeId && l.target.id != targetNodeId || l.source.id != targetNodeId && l.target.id == nodeId) {
            flag = true
            return flag
        }
    }
    return flag
}


/**
 * 设置node的propertyMsg
 * @param {*} nodes
 * @param {*} canvasCtx
 */
function setNodePropertyMsg(nodes, canvasCtx) {
  if(nodes.length < 1){
    return
  }
    canvasCtx.save()
    canvasCtx.font = '2px serif'

    let maxWidth = 6
    nodes.forEach(n => {
        if (n.propertyMsg) {
            return
        }
        let msg = n.mainCategory === 'Movie' ? n.properties.title : n.properties.name

        if (canvasCtx.measureText(msg).width > maxWidth) {
            let i = msg.length - 1
            while (canvasCtx.measureText(msg).width > maxWidth && i > 0) {
                msg = msg.slice(0, i)
                i--
            }
            msg += '...'
        }
        n.propertyMsg = msg

        n.textWidth = canvasCtx.measureText(n.propertyMsg).width
    })
    canvasCtx.restore()
}

function findNodeById(id, nodes, callback){
    let worker = new Worker('./findNodeByIdWorker.js')
    worker.postMessage({id, nodes})
    worker.onmessage = (e) => {
        // e.data = 对应id所在nodes的索引
        callback(nodes[e.data])
        worker.terminate()
    }
}

export {
    getLinkCount,
    hasAnotherLink,
    setNodePropertyMsg,
    findNodeById
}