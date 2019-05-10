importScripts('./lodash.js')

this.addEventListener('message', e => {
  let originData = e.data.data.od
  let commingData = e.data.data.comming
  let newLinks = filterDuplicateLink(originData.links, commingData.links)
  let newNodes = filterDuplicateNode(commingData.nodes, originData)
  originData.links.push(...newLinks)
  originData.nodes.push(...newNodes)
  postMessage(originData)
})

/**
 * 返回过滤掉重复Link的commingLinks
 * @param {*} odLinks
 * @param {*} comingLinks
 */
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

/**
 * 过滤重复的node
 */
function filterDuplicateNode(nodes, od) {
  let nodeIdSet = new Set()
  // node id 和其在originData中对应的索引位置
  let nodeIdAndIndex = []

  od.nodes.forEach((node, idx) => {
    if(!nodeIdSet.has(node.id)){
      nodeIdSet.add(node.id)
      nodeIdAndIndex.push({
        id:node.id,
        index:idx
      })
    }
  })
  nodes.forEach((node, index) => {
    if (nodeIdSet.has(node.id)) {
      // 复制属性的值给已存在的node
      let idxInOd = findIndexById(node.id, nodeIdAndIndex)
      Object.assign(od.nodes[idxInOd], node)

      delete nodes[index]
    } else {
      nodeIdSet.add(node.id)
    }
  })

  nodes = nodes.filter(n => n)
  return nodes
}

/**
 * 根据id返回索引
 * @param {*} id
 * @param {*} arr [{id:..., index:...}]
 */
function findIndexById(id, arr){
  for(let i = 0; i < arr.length; i++){
    if(arr[i].id === id){
      return arr[i].index
    }
  }
  return null
}