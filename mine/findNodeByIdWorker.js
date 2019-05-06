this.addEventListener('message', e => {
  let index = findNodeById(e.data.id, e.data.nodes)
  postMessage(index)
})

/**
 * 返回所在的索引
 * @param {*} id
 * @param {*} nodes
 */
function findNodeById(id, nodes){
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if(n.id == id){
      return i
    }
  }
  return null
}