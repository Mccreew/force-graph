/**
 * 得到一个节点有多少条边
 * @param {*} nodeId node的id
 * @param {*} links 所有的边
 */
function getLinkCount(nodeId, links){
    let count = 0
    links.forEach(l => {
        if(l.source.id == nodeId || l.target.id == nodeId){
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
function hasAnotherLink(nodeId, links, targetNodeId){
    let flag = false
    for (let i = 0; i < links.length; i++) {
        const l = links[i];
        if(l.source.id == nodeId && l.target.id != targetNodeId || l.source.id != targetNodeId && l.target.id == nodeId){
            flag = true
            return flag
        }
    }
    return flag
}

export {getLinkCount, hasAnotherLink}