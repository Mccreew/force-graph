importScripts('./lodash.js')

this.addEventListener('message', e => {
  let originData = e.data.data.od
  let commingData = e.data.data.comming
  let newLinks = filterDuplicateLink(originData.links, commingData.links)
  originData.links.push(...newLinks)
  originData.nodes.push(...commingData.nodes)
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
